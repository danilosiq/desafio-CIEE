export class DuplicateAreaNameError extends Error {
    constructor() {
        super('Já existe uma área de atuação com esse nome.');
        this.name = 'DuplicateAreaNameError';
    }
}
