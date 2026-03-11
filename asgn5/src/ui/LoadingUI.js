/**
 * LoadingUI — manages the loading status text in the HUD.
 */
export class LoadingUI {
    constructor(elementId = 'load-status') {
        this.el = document.getElementById(elementId);
    }

    setStatus(msg) {
        if (this.el) this.el.textContent = msg;
    }

    hide() {
        if (!this.el) return;
        this.el.style.transition = 'opacity 1s ease';
        this.el.style.opacity = '0';
    }
}
