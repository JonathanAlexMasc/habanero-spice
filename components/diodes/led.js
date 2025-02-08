export class LED extends Entities {
    static LED_ID = 0;

    constructor(posx = '500px', posy = '500px') {
        super();
        this.name = "DLED" + ++LED.LED_ID;
        this.imgSrc = "images/Diode/led-diode.svg";
        this.x = posx;
        this.y = posy;
        this.intX = parseInt(this.x, 10);
        this.intY = parseInt(this.y, 10);
        this.numInCons = 1;
        this.numOutCons = 1;
        this.Currconnections = [];
        this.modelName = `LED_MODEL_${LED.LED_ID}`;
        this.info = this.modelName
        this.equation = this.name;

        // LED MODEL PROPERTIES
        this.IS = 1e-14
        this.N = 1.0
        this.RS = 5
        this.BV = 5.1
        this.CJ0 = 1
        this.M = 0.5
        this.VJ = 0.7
        this.IBV = 10

        // Updated model with all parameters
        this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;

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
        LED.LED_ID = 0;
    }

    displayModifiableValues() {
        const modal = document.createElement('div');
        modal.classList.add('modal', 'fade');
        modal.id = `LEDModal${LED.LED_ID}`;
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

    /* Flexbox to align label, input, and unit */
    .input-group {
        margin-bottom: 20px;
        display: flex;
        align-items: center; /* Align items in the center vertically */
    }

    /* Set fixed width for labels */
    .input-group .form-label {
        font-weight: 500;
        font-size: 1rem;
        margin-bottom: 0;
        display: inline-block;
    }

    .input-group .form-control {
        border-radius: 5px;
        padding: 10px;
        font-size: 1rem;
        width: 70%; /* Adjust width of input */
        margin-right: 20px;
    }

    .input-group .unit-label {
        font-size: 1rem;
        color: #6c757d;
        margin-left: 20px;
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
            <h5 class="modal-title">Modify LED Params</h5>
        </div>
        <div class="modal-body">
            <div class="input-group mb-3">
                <label for="reverseSaturationCurrent" class="form-label">Reverse Saturation Current (IS)</label>
                <input type="number" class="form-control" id="reverseSaturationCurrent" value="${this.IS}" aria-label="Reverse Saturation Current">
                <span class="unit-label">A</span> <!-- Add unit here -->
            </div>
            <div class="input-group mb-3">
                <label for="emissionCoeff" class="form-label">Emission Coefficient (N)</label>
                <input type="number" class="form-control" id="emissionCoeff" value="${this.N}" aria-label="Emission Coefficient">
                <span class="unit-label">No units</span> <!-- Emission Coefficient doesn't have specific units -->
            </div>
            <div class="input-group mb-3">
                <label for="seriesResistance" class="form-label">Series Resistance (RS)</label>
                <input type="number" class="form-control" id="seriesResistance" value="${this.RS}" aria-label="Series Resistance">
                <span class="unit-label">Ω</span> <!-- Ohms (Ω) for resistance -->
            </div>
            <div class="input-group mb-3">
                <label for="bv" class="form-label">Breakdown Voltage (BV)</label>
                <input type="number" class="form-control" id="bv" value="${this.BV}" aria-label="Breakdown Voltage">
                <span class="unit-label">V</span> <!-- Volts (V) for breakdown voltage -->
            </div>
            <div class="input-group mb-3">
                <label for="cj0" class="form-label">Zero-Bias Junction Capacitance (CJO)</label>
                <input type="number" class="form-control" id="cj0" value="${this.CJ0}" aria-label="Zero-Bias Junction Capacitance">
                <span class="unit-label">F</span> <!-- Farads (F) for capacitance -->
            </div>
            <div class="input-group mb-3">
                <label for="gradingCoefficient" class="form-label">Grading Coefficient (M)</label>
                <input type="number" class="form-control" id="gradingCoefficient" value="${this.M}" aria-label="Grading Coefficient">
                <span class="unit-label">No units</span> <!-- No specific unit for grading coefficient -->
            </div>
            <div class="input-group mb-3">
                <label for="junctionPotential" class="form-label">Junction Potential (VJ)</label>
                <input type="number" class="form-control" id="junctionPotential" value="${this.VJ}" aria-label="Junction Potential">
                <span class="unit-label">V</span> <!-- Volts (V) for junction potential -->
            </div>
            <div class="input-group mb-3">
                <label for="reverseBreakdownCurrent" class="form-label">Reverse Breakdown Current (IBV)</label>
                <input type="number" class="form-control" id="reverseBreakdownCurrent" value="${this.IBV}" aria-label="Reverse Breakdown Current">
                <span class="unit-label">A</span> <!-- Amperes (A) for reverse breakdown current -->
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
        const reverseSaturationCurrent = modal.querySelector('#reverseSaturationCurrent');
        reverseSaturationCurrent.addEventListener('input', () => {
            this.IS = parseFloat(reverseSaturationCurrent.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const emissionCoeff = modal.querySelector('#emissionCoeff');
        emissionCoeff.addEventListener('input', () => {
            this.N = parseFloat(emissionCoeff.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const seriesResistance = modal.querySelector('#seriesResistance');
        seriesResistance.addEventListener('input', () => {
            this.RS = parseFloat(seriesResistance.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const bv = modal.querySelector('#bv');
        bv.addEventListener('input', () => {
            this.BV = parseFloat(bv.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const cj0 = modal.querySelector('#cj0');
        cj0.addEventListener('input', () => {
            this.CJ0 = parseFloat(cj0.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const gradingCoefficient = modal.querySelector('#gradingCoefficient');
        gradingCoefficient.addEventListener('input', () => {
            this.M = parseFloat(gradingCoefficient.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const junctionPotential = modal.querySelector('#junctionPotential');
        junctionPotential.addEventListener('input', () => {
            this.VJ = parseFloat(junctionPotential.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
        });

        const reverseBreakdownCurrent = modal.querySelector('#reverseBreakdownCurrent');
        reverseBreakdownCurrent.addEventListener('input', () => {
            this.IBV = parseFloat(reverseBreakdownCurrent.value);
            this.model = `.MODEL ${this.modelName} D(IS=${this.IS} N=${this.N} RS=${this.RS} BV=${this.BV} CJO=${this.CJ0} M=${this.M} VJ=${this.VJ} IBV=${this.IBV})`;
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

window.LED = LED;

export function AddLED(posx, posy) {
    return new LED(posx, posy);
}


