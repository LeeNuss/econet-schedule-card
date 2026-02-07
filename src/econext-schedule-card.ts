import { LitElement, html, nothing, type CSSResultGroup, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type {
  HomeAssistant,
  EconextScheduleCardConfig,
  DayKey,
  DaySchedule,
} from './types';
import { combineAmPm, toggleBit } from './bitfield';
import {
  DAYS_ORDER,
  DAY_LABELS,
  SLOTS_PER_DAY,
  getCurrentSlotIndex,
  getCurrentDay,
  slotToTime,
  isAmSlot,
  slotToBitIndex,
  DEFAULT_ACTIVE_COLOR,
  DEFAULT_INACTIVE_COLOR,
} from './constants';

import { cardStyles } from './styles';

const HOURS = 24;

@customElement('econext-schedule-card')
export class EconextScheduleCard extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config?: EconextScheduleCardConfig;
  @state() private _selectedDay: DayKey = getCurrentDay();

  static get styles(): CSSResultGroup {
    return cardStyles;
  }

  public setConfig(config: EconextScheduleCardConfig): void {
    if (!config.schedule_entity_prefix) {
      throw new Error('Please define schedule_entity_prefix');
    }

    this._config = {
      editable: true,
      show_time_labels: true,
      highlight_current_day: true,
      highlight_current_slot: true,
      active_color: DEFAULT_ACTIVE_COLOR,
      inactive_color: DEFAULT_INACTIVE_COLOR,
      ...config,
    };
  }

  public getCardSize(): number {
    // Title + tabs + schedule row + time labels + padding
    return this._config?.title ? 4 : 3;
  }

  public getLayoutOptions() {
    return {
      grid_rows: this._config?.title ? 4 : 3,
      grid_min_rows: this._config?.title ? 4 : 3,
    };
  }

  public static getStubConfig(): Partial<EconextScheduleCardConfig> {
    return {
      schedule_entity_prefix: 'number.econext_dhw_schedule',
      title: 'Schedule',
    };
  }

  private _getEntityId(day: DayKey, period: 'am' | 'pm'): string {
    return `${this._config!.schedule_entity_prefix}_${day}_${period}`;
  }

  private _getEntityValue(entityId: string): number | null {
    const entity = this.hass?.states[entityId];
    if (!entity) return null;
    const value = parseFloat(entity.state);
    return isNaN(value) ? null : value;
  }

  private _buildDaySchedule(day: DayKey): DaySchedule | null {
    const amEntityId = this._getEntityId(day, 'am');
    const pmEntityId = this._getEntityId(day, 'pm');
    const amValue = this._getEntityValue(amEntityId);
    const pmValue = this._getEntityValue(pmEntityId);

    if (amValue === null || pmValue === null) {
      return null;
    }

    return {
      day,
      amEntityId,
      pmEntityId,
      amValue,
      pmValue,
      slots: combineAmPm(amValue, pmValue),
    };
  }

  private async _handleCellClick(
    day: DayKey,
    slotIndex: number,
    _currentValue: boolean
  ): Promise<void> {
    if (!this._config?.editable || !this.hass) return;

    const isAm = isAmSlot(slotIndex);
    const bitIndex = slotToBitIndex(slotIndex);
    const entityId = this._getEntityId(day, isAm ? 'am' : 'pm');

    const currentBitfield = this._getEntityValue(entityId);
    if (currentBitfield === null) return;

    const newValue = toggleBit(currentBitfield, bitIndex);

    try {
      await this.hass.callService('number', 'set_value', {
        entity_id: entityId,
        value: newValue,
      });
    } catch (error) {
      console.error('Failed to update schedule:', error);
    }
  }

  protected render(): TemplateResult {
    if (!this._config || !this.hass) {
      return html``;
    }

    const currentDay = getCurrentDay();
    const currentSlot = getCurrentSlotIndex();
    const selectedDaySchedule = this._buildDaySchedule(this._selectedDay);

    // Check if entities exist
    if (!selectedDaySchedule) {
      // Try to find any valid day
      const anyValidDay = DAYS_ORDER.find(day => this._buildDaySchedule(day) !== null);
      if (!anyValidDay) {
        return html`
          <ha-card>
            <div class="warning">
              No schedule entities found for prefix:
              ${this._config.schedule_entity_prefix}
            </div>
          </ha-card>
        `;
      }
    }

    const activeColor = this._config.active_color || DEFAULT_ACTIVE_COLOR;
    const inactiveColor = this._config.inactive_color || DEFAULT_INACTIVE_COLOR;

    return html`
      <ha-card>
        ${this._config.title
          ? html`
              <div class="card-header">
                <div class="title">${this._config.title}</div>
              </div>
            `
          : nothing}

        <!-- Day tabs -->
        <div class="day-tabs">
          ${DAYS_ORDER.map(day => html`
            <button
              class="day-tab ${classMap({
                active: day === this._selectedDay,
                'current-day': this._config!.highlight_current_day !== false && day === currentDay,
              })}"
              @click=${() => { this._selectedDay = day; }}
            >
              ${DAY_LABELS[day]}
            </button>
          `)}
        </div>

        <!-- Schedule row -->
        <div class="schedule-container">
          <div class="schedule-row-wrapper">
            ${selectedDaySchedule
              ? this._renderScheduleRow(
                  selectedDaySchedule,
                  this._selectedDay === currentDay,
                  currentSlot,
                  activeColor,
                  inactiveColor
                )
              : this._renderEmptyRow()}

            ${this._config.show_time_labels !== false
              ? this._renderTimeLabels()
              : nothing}
          </div>
        </div>
      </ha-card>
    `;
  }

  private _renderTimeLabels(): TemplateResult {
    return html`
      <div class="time-labels">
        ${Array.from({ length: SLOTS_PER_DAY }, (_, i) => {
          const hour = Math.floor(i / 2);
          const isHalfHour = i % 2 !== 0;

          return html`
            <div class="time-label">
              ${isHalfHour ? '' : hour}
            </div>
          `;
        })}
      </div>
    `;
  }

  private _renderScheduleRow(
    daySchedule: DaySchedule,
    isCurrentDay: boolean,
    currentSlot: number,
    activeColor: string,
    inactiveColor: string
  ): TemplateResult {
    const editable = this._config?.editable !== false;

    return html`
      <div class="schedule-row">
        ${daySchedule.slots.map((active, slotIndex) => {
          const isCurrentSlotHighlight =
            this._config?.highlight_current_slot !== false &&
            isCurrentDay &&
            slotIndex === currentSlot;

          return html`
            <div
              class="schedule-cell ${classMap({
                active,
                inactive: !active,
                'current-slot': isCurrentSlotHighlight,
                readonly: !editable,
              })}"
              style=${styleMap({
                backgroundColor: active ? activeColor : inactiveColor,
              })}
              title="${slotToTime(slotIndex)} - ${active ? 'Active' : 'Inactive'}"
              @click=${() =>
                this._handleCellClick(daySchedule.day, slotIndex, active)}
            ></div>
          `;
        })}
      </div>
    `;
  }

  private _renderEmptyRow(): TemplateResult {
    return html`
      <div class="schedule-row">
        ${Array.from({ length: SLOTS_PER_DAY }, () => html`
          <div
            class="schedule-cell inactive readonly"
            style="opacity: 0.3"
            title="No data"
          ></div>
        `)}
      </div>
    `;
  }
}

// Register with custom card picker
declare global {
  interface Window {
    customCards?: Array<{
      type: string;
      name: string;
      description: string;
      preview?: boolean;
      documentationURL?: string;
    }>;
  }
  interface HTMLElementTagNameMap {
    'econext-schedule-card': EconextScheduleCard;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'econext-schedule-card',
  name: 'ecoNEXT Schedule Card',
  description: 'Display and edit weekly schedules from ecoNEXT integration',
  preview: true,
});
