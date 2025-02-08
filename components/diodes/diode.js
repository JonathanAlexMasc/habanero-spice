// Class for Diode, extends Entities
export class Diode extends Entities {
    static diodeID = 0;

    constructor(posx = '500px', posy = '500px') {
        super();
        this.name = "D" + ++Diode.diodeID;
        this.imgSrc = "images/Diode/diode.svg";
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.numInCons = 1;
        this.numOutCons = 1;
        this.Currconnections = [];
        this.modelName = `D_MODEL_${Diode.diodeID}`;
        this.info = this.modelName
        this.equation = this.name;
        
        // DIODE MODEL PROPERTIES
        this.reverseSaturationCurrent = 1e-14
        this.emissionCoeff = 1.0
        
        this.model = `.MODEL ${this.modelName} D(IS=${this.reverseSaturationCurrent} N=${this.emissionCoeff})`;
        this.blockNodes();
        this.buildComponent();
        this.updateCoordinates(this.x, this.y);
    }

    attachConnectors(numInCons, numOutCons, holderBtn) {
        let conIDCounter = 0;
        for (let i = 0; i < numInCons; i++) {
            const con = document.createElement("button");
            con.className = "in-connector";
            con.classList.add("in-connector-" + i);
            con.id = this.name + "-connector-" + conIDCounter++;
            con.id = this.name + "-connector-" + conIDCounter++;
            holderBtn.appendChild(con);
            this.attachWireListener(con, con.id);
            this.attachProbeListener(con, con.id);
            this.attachLeft(con);
            this.Style(con); //makes a connector on the left
            this.connectors.push(con);
        }
        for (let i = 0; i < numOutCons; i++) {
            const con = document.createElement("button");
            con.id = this.name + "-connector-" + conIDCounter++;
            con.id = this.name + "-connector-" + conIDCounter++;
            con.className = "out-connector";
            con.classList.add("out-connector-" + i);
            holderBtn.appendChild(con);
            this.attachWireListener(con, con.id);
            this.attachProbeListener(con, con.id);
            this.attachRight(con); //attaches on the bot
            this.Style(con); //styles the connector (adds img, size, etc)
            this.connectors.push(con);
        }
    }

    attachRight(button2) {
        button2.style.right = "-10px"; // Adjust as needed to move it to the right of the main button
        button2.style.top = "50%";
        button2.style.transform = "translateY(-50%)";
        button2.classList.add("right-connector");
    }

    attachLeft(button) {
        button.style.left = "-10px"; // Adjust as needed to move it to the left of the main button
        button.style.top = "50%";
        button.style.transform = "translateY(-50%)";
        button.classList.add("left-connector");
    }

    static resetID() {
        Diode.diodeID = 0;
    }

    displayModifiableValues() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = `diodeModal${Diode.diodeID}`;
        modal.tabIndex = -1;

        modal.innerHTML = `
    <style>
        /* Modal Styling */
        .modal-dialog {
            max-width: 500px;
            margin: 30px auto;
        }

        .modal-content {
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            background-color: #fff;
            border: 1px solid #ccc;
        }

        .modal-header {
            background-color: #6c757d;
            color: white;
            border-bottom: 1px solid #ccc;
            padding: 15px;
        }

        .modal-title {
            font-size: 1.25rem;
            font-weight: 600;
        }

        .modal-body {
            padding: 20px;
            background-color: #f9f9f9;
            display: flex;
            flex-direction: column;
        }

        /* Remove flex from input group and stack label and input vertically */
        .input-group {
            margin-bottom: 20px;
            display: flex;
            align-items: center; /* Align input and unit label in a row */
        }

        /* Set fixed width for labels */
        .input-group .form-label {
            font-weight: 500;
            font-size: 1rem;
            margin-bottom: 0;
            width: 70%; /* Adjust width of label */
            display: inline-block;
        }

        .input-group .form-control {
            border-radius: 5px;
            padding: 10px;
            font-size: 1rem;
            width: 70%;
            margin-right: 20px;
        }

        .input-group .unit-label {
            font-size: 1rem;
            color: #6c757d;
            margin-left: 10px; /* Space between input field and unit label */
        }

        .input-group .form-control:focus {
            border-color: #007bff;
            box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
        }

        .modal-footer {
            display: flex;
            justify-content: flex-end;
            padding: 10px;
        }

        .btn {
            border-radius: 5px;
            padding: 10px 20px;
            font-size: 1rem;
        }

        .btn-secondary {
            background-color: #6c757d;
            color: white;
        }

        .btn-secondary:hover {
            background-color: #5a6268;
        }
    </style>

    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Modify Diode Params</h5>
            </div>
            <div class="modal-body">
                <div class="input-group mb-3">
                    <label for="reverseSaturationCurrent" class="form-label">Reverse Saturation Current (IS)</label>
                    <input type="number" class="form-control" id="reverseSaturationCurrent" value="${this.reverseSaturationCurrent}" aria-label="Reverse Saturation Current">
                    <span class="unit-label">A</span> <!-- Unit label for amperes -->
                </div>
                <div class="input-group mb-3">
                    <label for="emissionCoeff" class="form-label">Emission Coefficient (N)</label>
                    <input type="number" class="form-control" id="emissionCoeff" value="${this.emissionCoeff}" aria-label="Emission Coefficient">
                    <span class="unit-label">No units</span> <!-- Emission Coefficient doesn't have a specific unit -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="close">Close</button>
            </div>
        </div>
    </div>
    `;


        document.body.appendChild(modal);
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();

        // Handling input changes
        const reverseSaturationCurrentInput = modal.querySelector('#reverseSaturationCurrent');
        reverseSaturationCurrentInput.addEventListener('input', () => {
            this.reverseSaturationCurrent = parseFloat(reverseSaturationCurrentInput.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.reverseSaturationCurrent} N=${this.emissionCoeff})`;
        });

        const emissionCoeffInput = modal.querySelector('#emissionCoeff');
        emissionCoeffInput.addEventListener('input', () => {
            this.emissionCoeff = parseFloat(emissionCoeffInput.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.reverseSaturationCurrent} N=${this.emissionCoeff})`;
        });

        const closeBtn = modal.querySelector('#close');
        closeBtn.addEventListener('click', () => {
            bootstrapModal.hide()
            modal.remove();
        });

        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    }

}

window.Diode = Diode;

export function AddDiode(posx, posy) {
    return new Diode(posx, posy);
}


