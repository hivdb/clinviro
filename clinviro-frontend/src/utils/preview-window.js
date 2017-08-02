/**
 * ClinViro
 * Copyright (C) 2017 Stanford HIVDB team.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

export default class PreviewWindow {

  constructor(width = 800, height = 900) {
    this.prevWindow = window.open(
      'about:blank', '_preview_window',
      `width=${width},height=${height},resizable,scrollbars=yes,` +
      'menubar=no,toolbar=no,personalbar=no,status=no'
    );
    window.focus();
  }

  setLocation(location, previewCallback = null) {
    if (previewCallback) {
      const preview = `__preview_${Math.ceil(Math.random() * 0xffff)}`;
      location += `&preview=${preview}`;
      const onPreviewCallbackReceived = ({data, origin}) => {
        if (origin !== window.location.origin || data !== preview) {
          return;
        }
        previewCallback();
        window.removeEventListener('message', onPreviewCallbackReceived, false);
      };
      window.addEventListener('message', onPreviewCallbackReceived, false);
    }
    this.prevWindow.location = location;
    this.prevWindow.focus();
  }

}
