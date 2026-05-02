import { BatchIngestionController } from './BatchIngestionController.js';

export class FileReaderController {
    #controller;
    #dropTarget;
    #fileInput;

    constructor(bus, session) {
        this.#controller = new BatchIngestionController(bus, session);
    }

    bindDropZone(element) {
        this.#dropTarget = element;
        element.addEventListener('dragover', (e) => { e.preventDefault(); element.classList.add('drag-over'); });
        element.addEventListener('dragleave', () => element.classList.remove('drag-over'));
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) this.#controller.ingestFiles(files);
        });
    }

    bindFileInput(inputElement) {
        this.#fileInput = inputElement;
        inputElement.addEventListener('change', () => {
            if (inputElement.files.length > 0) {
                this.#controller.ingestFiles(inputElement.files);
                inputElement.value = '';
            }
        });
    }

    openPicker() {
        if (this.#fileInput) this.#fileInput.click();
    }

    async ingestText(name, content) {
        return this.#controller.ingestText(name, content);
    }
}