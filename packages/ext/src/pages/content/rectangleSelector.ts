export class RectangleSelector {
  private isSelecting = false;
  private startX = 0;
  private startY = 0;
  private selectionBox: HTMLDivElement | null = null;
  private overlay: HTMLDivElement | null = null;
  private selectedElements: Element[] = [];
  private onSelectionComplete: ((elements: Element[]) => void) | null = null;

  constructor() {
    this.createOverlay();
    this.setupEventListeners();
  }

  private createOverlay() {
    // Create a full-page overlay
    this.overlay = document.createElement('div');
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999999;
      cursor: crosshair;
      background: rgba(0, 0, 0, 0.1);
      display: none;
    `;
    this.overlay.style.width = `${Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)}px`;
    this.overlay.style.height = `${Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)}px`;
    
    // Create selection box
    this.selectionBox = document.createElement('div');
    this.selectionBox.style.cssText = `
      position: absolute;
      border: 2px solid #4285f4;
      background: rgba(66, 133, 244, 0.1);
      display: none;
      pointer-events: none;
    `;
    
    this.overlay.appendChild(this.selectionBox);
    document.body.appendChild(this.overlay);
  }

  private setupEventListeners() {
    this.overlay?.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.overlay?.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.overlay?.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.overlay?.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleMouseDown(e: MouseEvent) {
    this.isSelecting = true;
    // Use pageX/pageY for document-relative coordinates
    this.startX = e.pageX;
    this.startY = e.pageY;
    
    if (this.selectionBox) {
      this.selectionBox.style.left = `${this.startX}px`;
      this.selectionBox.style.top = `${this.startY}px`;
      this.selectionBox.style.width = '0';
      this.selectionBox.style.height = '0';
      this.selectionBox.style.display = 'block';
    }

    // Clear previous selections
    this.clearHighlights();
    this.selectedElements = [];
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isSelecting || !this.selectionBox) return;

    // Use pageX/pageY for document-relative coordinates
    const currentX = e.pageX;
    const currentY = e.pageY;
    
    const left = Math.min(this.startX, currentX);
    const top = Math.min(this.startY, currentY);
    const width = Math.abs(currentX - this.startX);
    const height = Math.abs(currentY - this.startY);
    
    this.selectionBox.style.left = `${left}px`;
    this.selectionBox.style.top = `${top}px`;
    this.selectionBox.style.width = `${width}px`;
    this.selectionBox.style.height = `${height}px`;

    // Highlight elements within selection
    this.highlightElementsInSelection(left, top, width, height);
  }

  private handleMouseUp(e: MouseEvent) {
    if (!this.isSelecting) return;
    
    this.isSelecting = false;
    if (this.selectionBox) {
      this.selectionBox.style.display = 'none';
    }

    // Complete selection
    if (this.selectedElements.length > 0) {
      this.completeSelection();
    } else {
      this.cancel();
    }
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.cancel();
    }
  }

  private highlightElementsInSelection(left: number, top: number, width: number, height: number) {
    // Clear previous highlights
    this.clearHighlights();
    this.selectedElements = [];

    const selectionRect = {
      left: left,
      top: top,
      right: left + width,
      bottom: top + height
    };

    // Get all elements in the document
    const allElements = document.querySelectorAll('*:not(script):not(style):not(noscript)');
    
    allElements.forEach(element => {
      // Skip our own overlay elements
      if (element === this.overlay || element === this.selectionBox || element.closest('#__airframe-selector-overlay')) {
        return;
      }

      const rect = element.getBoundingClientRect();
      // Convert rect to document coordinates
      const docRect = {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        right: rect.right + window.scrollX,
        bottom: rect.bottom + window.scrollY,
        width: rect.width,
        height: rect.height
      };
      
      // Check if element is covered by at least 45% by the selection box
      const intersectionLeft = Math.max(docRect.left, selectionRect.left);
      const intersectionTop = Math.max(docRect.top, selectionRect.top);
      const intersectionRight = Math.min(docRect.right, selectionRect.right);
      const intersectionBottom = Math.min(docRect.bottom, selectionRect.bottom);
      
      // Calculate intersection area
      const intersectionWidth = Math.max(0, intersectionRight - intersectionLeft);
      const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop);
      const intersectionArea = intersectionWidth * intersectionHeight;
      
      // Calculate element area
      const elementArea = docRect.width * docRect.height;
      
      // Check if at least 45% of the element is covered
      if (elementArea > 0 && (intersectionArea / elementArea) >= 0.45) {
        
        // Add highlight
        (element as HTMLElement).style.outline = '2px solid #4285f4';
        (element as HTMLElement).style.outlineOffset = '-2px';
        (element as HTMLElement).dataset.airframeSelected = 'true';
        
        this.selectedElements.push(element);
      }
    });
  }

  private clearHighlights() {
    document.querySelectorAll('[data-airframe-selected="true"]').forEach(element => {
      (element as HTMLElement).style.outline = '';
      (element as HTMLElement).style.outlineOffset = '';
      delete (element as HTMLElement).dataset.airframeSelected;
    });
  }

  private completeSelection() {
    // Clone selected elements to preserve their HTML
    const clonedElements = this.selectedElements.map(el => {
      const clone = el.cloneNode(true) as HTMLElement;
      // Remove our selection attributes
      delete clone.dataset.airframeSelected;
      clone.style.outline = '';
      clone.style.outlineOffset = '';
      return clone;
    });

    // Send selected elements to extension
    if (this.onSelectionComplete) {
      this.onSelectionComplete(clonedElements);
    }

    this.hide();
  }

  public show(onComplete: (elements: Element[]) => void) {
    this.onSelectionComplete = onComplete;
    if (this.overlay) {
      // Update overlay size in case document size changed
      this.overlay.style.width = `${Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)}px`;
      this.overlay.style.height = `${Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)}px`;
      this.overlay.style.display = 'block';
      this.overlay.id = '__airframe-selector-overlay';
    }
  }

  public hide() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }
    this.clearHighlights();
    this.selectedElements = [];
  }

  public cancel() {
    this.hide();
    this.isSelecting = false;
    if (this.selectionBox) {
      this.selectionBox.style.display = 'none';
    }
  }

  public destroy() {
    this.overlay?.remove();
    this.overlay = null;
    this.selectionBox = null;
  }
}