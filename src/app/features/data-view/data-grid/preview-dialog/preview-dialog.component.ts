import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface PreviewDialogData {
  fieldLabel: string;
  fieldPath: string;
  value: unknown;
}

@Component({
  selector: 'app-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    ClipboardModule,
  ],
  templateUrl: './preview-dialog.component.html',
  styleUrl: './preview-dialog.component.scss',
})
export class PreviewDialogComponent {
  readonly formattedJson: string;
  readonly valueType: string;
  readonly valueStats: string | null;
  wrapJson = false;
  copyState: 'idle' | 'copied' | 'failed' = 'idle';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PreviewDialogData,
    private dialogRef: MatDialogRef<PreviewDialogComponent>,
    private clipboard: Clipboard
  ) {
    this.formattedJson = this.stringifyValue(this.data.value);
    this.valueType = this.getValueType(this.data.value);
    this.valueStats = this.getValueStats(this.data.value);
  }

  close(): void {
    this.dialogRef.close();
  }

  toggleWrap(): void {
    this.wrapJson = !this.wrapJson;
  }

  copyJson(): void {
    const success = this.clipboard.copy(this.formattedJson);
    this.copyState = success ? 'copied' : 'failed';

    if (success) {
      setTimeout(() => {
        if (this.copyState === 'copied') {
          this.copyState = 'idle';
        }
      }, 2000);
    }
  }

  private stringifyValue(value: unknown): string {
    if (value === undefined) {
      return 'undefined';
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  private getValueType(value: unknown): string {
    if (Array.isArray(value)) {
      return 'Array';
    }

    if (value === null) {
      return 'Null';
    }

    const type = typeof value;
    if (type === 'object') {
      return 'Object';
    }

    return type.charAt(0).toUpperCase() + type.slice(1);
  }

  private getValueStats(value: unknown): string | null {
    if (Array.isArray(value)) {
      return `${value.length} item${value.length === 1 ? '' : 's'}`;
    }

    if (value && typeof value === 'object') {
      const keys = Object.keys(value as Record<string, unknown>);
      return `${keys.length} key${keys.length === 1 ? '' : 's'}`;
    }

    return null;
  }
}
