var numPoints = 500;
var valid = -1;
// Generate initial sine wave data
var xData = [];
var yData = [];
var dx = 2 * Math.PI / numPoints;
var plotType = 'ACSweep';
var VoltName = '';
var data = {
  frequency: [],
  dB: []
};


// Variables for each analysis type
var startFreq = 1, endFreq = 10000000000, numPoints = 1000; // AC Sweep
var startVolt = 0, endVolt = 5, step = 0.1; // DC Sweep
var startTime = 0, stopTime = 5, timeStep = 0.01; // Transient


const controlSection = `.control
ac dec 50 1 10G ;
print db(i(Voltage1))
.endc`;


for (var i = 0; i < numPoints; i++) {
    xData.push(i * dx);
    yData.push(Math.sin(i * dx));
}

var amplitude = 1;
var frequency = 1;
var dcOff = 0;
var selectedShape = 'sine';

let existingChart;
let chartinitializer = false;


var ctx = document.getElementById('chartCanvas').getContext('2d');
var chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: xData,
        datasets: [{
            label: 'Initial Waveform',
            data: yData,
            borderColor: '#80CAF6',
            borderWidth: 1,
            fill: false,
            xAxisType: 'linear',
            yAxisType: 'linear'
        }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
          x: {
              title: {
                  display: true,
                  text: 'Frequency (Hz)'
              },
              ticks: {
                  maxRotation: 0, // Prevent label rotation
                  autoSkip: true,
                  maxTicksLimit: 10, // Max number of visible ticks
                  callback: function(value) {
                      // Truncate label if longer than 10 characters
                      if (value.length > 10) {
                          return value.substr(0, 10) + '...'; // Truncate and add ellipsis
                      } else {
                          return value;
                      }
                  }
              }
          },
          y: {
              title: {
                  display: true,
                  text: '(dB)'
              }
          }
      },
      animation: false
  }
});


function addPlotOption(plotname) {
  var plotSelect = document.getElementById("plotSelect");
  var newOption = document.createElement("option");
  newOption.value = plotname;
  newOption.text = plotname;
  plotSelect.appendChild(newOption);
}

function updateAxisScale(selectedPlot, selectedAxis, selectedScale) {
  // Find the dataset configuration for the selected plot
  var dataset = selectedPlot;
  if(selectedPlot === 'Signal In') {
    dataset = chart.data.datasets[0];
  }
  if(selectedPlot === 'ngspice Output') {
    dataset = chart.data.datasets[1];
  }

  // Update the axis type based on selected axis (x or y)
  if (selectedAxis === 'x') {
      dataset.xAxisType = selectedScale;
  } else if (selectedAxis === 'y') {
      dataset.yAxisType = selectedScale;
  }

  // Update the chart's axis scale options
  if (chart && chart.options && chart.options.scales) {
      if (selectedAxis === 'x') {
          chart.options.scales.x.type = selectedScale;
      } else if (selectedAxis === 'y') {
          chart.options.scales.y.type = selectedScale;
      }

      // Update the chart
      chart.update();
  }
}

function plotFromNgspiceOutput(output) {
  console.log("NGSpice Output")
  console.log(output);
  // Split the output into lines
  const lines = output.split('\n');
  const data = {
      frequency: [],
      dB: []
  };
  let parseData = false;

  // Iterate through each line of the output
  for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Start parsing after the line containing "AC Analysis"
      if (line.startsWith('AC Analysis')) {
          parseData = true;
          continue;
      }

      // Skip lines that start with specific keywords or patterns
      if (!parseData || line.startsWith('Circuit:') || line.startsWith('Using')) {
          continue;
      }

      // Parse the data lines
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
          const frequency = parseFloat(parts[1]);
          const dB2 = parseFloat(parts[2]);
          if (!isNaN(frequency) && !isNaN(dB2)) {
              data.frequency.push(frequency);
              data.dB.push(dB2);
          }
      }
  }

  console.log(data.dB, data.frequency);

  chart.data.datasets.push({
    label: 'ngspice Output',
    data: data.dB.map((d, i) => ({ x: data.frequency[i], y: d })),
    borderColor: '#FF5733',
    borderWidth: .5,
    fill: false,
    xAxisID: 'x-axis-2',
    yAxisID: 'y-axis-1'
});

chart.options.scales['x-axis-2'] = {
  title: {
      display: true,
      text: 'Frequency (Hz)'
  },
  type: 'logarithmic',
  position: 'top'
};

addPlotOption("ngspice Output");
chart.update();
}


function syncSliderAndInput(slider, input) {
    slider.addEventListener('input', () => {
        input.value = slider.value;
    });
    input.addEventListener('input', () => {
        slider.value = input.value;
    });
}

function updateGraphVals() {
  yData = xData.map(function(x) {
      switch (selectedShape) {
          case 'sine':
              return amplitude * Math.sin(x * frequency + dcOff);
          case 'square':
              return amplitude * (x % (2 * Math.PI) < Math.PI ? 1 : -1);
          case 'triangle':
            var phase = (x * frequency + dcOff) * Math.PI / (frequency / 2);
            return 2 * amplitude / Math.PI * Math.abs((((phase % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI)) - Math.PI) - amplitude;
            
          case 'sawtooth':
              var phase = (x * frequency + dcOff) / (2 * frequency);
              return amplitude * (phase - Math.floor(phase));
          default:
              return amplitude * Math.sin(x * frequency + dcOff);
      }
  });

  chart.data.datasets[0].data = yData;
  chart.update();
}

var cnt = 0;
var interval = setInterval(function() {
    updateGraphVals();
    if (++cnt === 100000) clearInterval(interval); // Stop after 100000 updates (adjust as needed)
}, 150); // Interval in milliseconds (adjust for desired animation speed)

function LinkAmplitude(slider, input) {

  slider.addEventListener('input', function() {
    amplitude = this.value;
  });

  input.addEventListener('input', function() {
    amplitude = this.value;
  })
  updateGraphVals();
}

function EditCircuit() {
  window.location.href = 'build.html';
}

function linkFrequency(slider, input) {

  slider.addEventListener('input', function() {
    frequency = this.value;
  });

  input.addEventListener('input', function() {
    frequency = this.value;
  })
  updateGraphVals();
}

function linkDCoffset(slider, input) {

  slider.addEventListener('input', function() {
    dcOff = this.value;
  });

  input.addEventListener('input', function() {
    dcOff = this.value;
  })
  updateGraphVals();
}

function validateNetlist(netlist) {
  // Check for --partial at the start of the netlist
  if (netlist.startsWith('--partial')) {
    console.log("Partial netlist detected");
    return 0;
  }

  // Check for the presence of .control, .endc, and .end lines in the netlist
  const controlPresent = netlist.includes('.control');
  const endcPresent = netlist.includes('.endc');
  const endPresent = netlist.includes('.end');

  if (controlPresent && endcPresent && endPresent) {
    console.log("Netlist is valid.");
    return 1;
  }

  // If none of the conditions match, return -1 for invalid
  console.log("Netlist is not valid.");
  return -1;
}

async function readFile(filePath) {
  try {
    const data = await window.electron.readFile(filePath);
    return data;
  } catch (error) {
    throw new Error(`Error reading file: ${error.message}`);
  }
}

async function writeFile(filePath, data) {
  try {
    await window.electron.writeFile(filePath, data);
  } catch (error) {
    throw new Error(`Error writing file: ${error.message}`);
  }
}


async function ModifyNetlist(filePath) {
  try {
    // Read the file content
    let existingContent = await readFile(filePath);

    // Initialize the control section and find probes
    let controlSection = `.control\n`;
    const probeLines = [];
    const lines = existingContent.split('\n');

    // Iterate through each line
    for (let line of lines) {
      //if (line.trim().startsWith('.probe')) {
        // Replace .probe with print and store it in the control section
        //const printLine = line.replace('.probe', 'print').trim();
       // probeLines.push(printLine);
      //}
      if (line.trim().startsWith('Voltage')) {
        //send the voltage name to VoltName variable
        VoltName = line.trim().split(' ')[0];
        console.log(VoltName);
      }
    }

    // Add probes to the control section
    //if (probeLines.length > 0) {
    //  controlSection += probeLines.join('\n') + '\n';
    //}

    console.log('plotType:', plotType);
    // Add control commands based on plotType
    switch (plotType) {
      case 'ACSweep':
        controlSection += `ac dec ${startFreq} ${endFreq} ${numPoints}\n`;
        break;
      case 'DCSweep':
        controlSection += `dc ${VoltName} ${startVolt} ${endVolt} ${step}\n`;
        break;
      case 'Transient':
        controlSection += `tran ${timeStep} ${stopTime}\n`;
        break;
      case 'DC OP':
        controlSection += `op\n`;
        break;
    }
    controlSection += `.endc`;

    // Remove the original `.probe` lines
    //existingContent = existingContent.replace(/^\.probe.*$/gm, '');

    // Remove --partial line
    existingContent = existingContent.replace(/^--partial\s*[\r\n]*/m, '');

    // Replace [fill] with SINE wave parameters
    const updatedContent = existingContent.replace('[fill]', `SINE (${dcOff} ${amplitude} ${frequency}k)`);

    //construct print statements
    var printString = '';

    switch (plotType) {
      case 'ACSweep':
        printString = `print db(${VoltName})`;
        break;
      case 'DCSweep':
        printString = `print db(${VoltName})`;
        break;
      case 'Transient':
        printString = `print db(${VoltName})`;
        break;
      case 'DC OP':
        printString = `print db(${VoltName})`;
        break;
    }

    // Construct new content with updated string and control section
    const newContent = `\n${updatedContent.trim()}\n\n${controlSection}\n.end`;

    // Change the file extension to .cir
    const newFilePath = filePath.replace(/\.[^/.]+$/, ".cir");

    // Write the modified content back to the new file
    await writeFile(newFilePath, newContent);
    console.log('Netlist modified successfully.');
    console.log('Netlist: ', newContent); 
    return newFilePath;
  } catch (error) {
    console.error('Error modifying netlist:', error);
  }
}




// Initialize syncing for each slider and input pair
document.addEventListener('DOMContentLoaded', async () => {


  const outputChooser = document.getElementById('OutType');
  const customContainer = document.getElementById('Custom_Container');


  function updateFields(selectedOutput) {
    customContainer.innerHTML = ''; // Clear previous content

    switch (selectedOutput) {
      case 'ACSweep':
        customContainer.innerHTML = `
          <label for="startFreq">Start Frequency:</label>
          <input type="number" id="startFreq" value="${startFreq}" placeholder="Enter start frequency">
          <label for="stopFreq">Stop Frequency:</label>
          <input type="number" id="stopFreq" value="${endFreq}" placeholder="Enter stop frequency">
          <label for="points">Points:</label>
          <input type="number" id="points" value="${numPoints}" placeholder="Enter points">
        `;
        document.getElementById('startFreq').addEventListener('input', (e) => startFreq = parseFloat(e.target.value));
        document.getElementById('stopFreq').addEventListener('input', (e) => endFreq = parseFloat(e.target.value));
        document.getElementById('points').addEventListener('input', (e) => numPoints = parseInt(e.target.value));
        plotType = 'ACSweep';
        break;

      case 'DCSweep':
        customContainer.innerHTML = `
          <label for="startVolt">Start Voltage:</label>
          <input type="number" id="startVolt" value="${startVolt}" placeholder="Enter start voltage">
          <label for="stopVolt">Stop Voltage:</label>
          <input type="number" id="stopVolt" value="${endVolt}" placeholder="Enter stop voltage">
          <label for="step">Step Size:</label>
          <input type="number" id="step" value="${step}" placeholder="Enter step size">
        `;
        document.getElementById('startVolt').addEventListener('input', (e) => startVolt = parseFloat(e.target.value));
        document.getElementById('stopVolt').addEventListener('input', (e) => endVolt = parseFloat(e.target.value));
        document.getElementById('step').addEventListener('input', (e) => step = parseFloat(e.target.value));
        plotType = 'DCSweep';
        break;

      case 'Transient':
        customContainer.innerHTML = `
          <label for="startTime">Start Time:</label>
          <input type="number" id="startTime" value="${startTime}" placeholder="Enter start time">
          <label for="stopTime">Stop Time:</label>
          <input type="number" id="stopTime" value="${stopTime}" placeholder="Enter stop time">
          <label for="timeStep">Time Step:</label>
          <input type="number" id="timeStep" value="${timeStep}" placeholder="Enter time step">
        `;
        document.getElementById('startTime').addEventListener('input', (e) => startTime = parseFloat(e.target.value));
        document.getElementById('stopTime').addEventListener('input', (e) => stopTime = parseFloat(e.target.value));
        document.getElementById('timeStep').addEventListener('input', (e) => timeStep = parseFloat(e.target.value));
        plotType = 'Transient';
        break;

      case 'DC OP':
        customContainer.innerHTML = `<p>No additional fields are required for DC OP.</p>`;
        plotType = 'DC OP';
        break;
    }
  }

  // Update fields when the selection changes
  outputChooser.addEventListener('change', function () {
    const selectedOutput = this.value;
    updateFields(selectedOutput);
  });

  // Simulate a change event to initialize fields for the default option
  updateFields(outputChooser.value);
  
  /**
   * Adds input fields dynamically to the Custom_Container.
   * @param {Array} fields - Array of objects with label, name, and placeholder for each field.
   */
  function addInputFields(fields) {
    fields.forEach(field => {
      const fieldContainer = document.createElement('div');
      fieldContainer.className = 'field-container';
  
      const label = document.createElement('label');
      label.textContent = field.label;
      label.htmlFor = field.name;
  
      const input = document.createElement('input');
      input.type = 'text';
      input.name = field.name;
      input.placeholder = field.placeholder;
  
      fieldContainer.appendChild(label);
      fieldContainer.appendChild(input);
      customContainer.appendChild(fieldContainer);
    });
  }
  

  var validSim = document.getElementById('simulateButton');
  validSim.classList.remove('valid');
  validSim.classList.add('invalid');
  validSim.disabled = true;

  const netlistPath = './Files/netlist.cir';
  
  const fileExists = window.electron.checkFileExists(netlistPath);
  
  if (fileExists) { // File exists
    const netlistContent = await readFile(netlistPath);
    const isValidNetlist = validateNetlist(netlistContent);
    document.getElementById('fileHolder').textContent = 'netlist.cir';
    document.getElementById('simulateButton').dataset.filePath = netlistPath;
    if (isValidNetlist === 1) {

      //console.log('Netlist is valid.');
      valid = 1;
      simulateButton.classList.remove('invalid');
      simulateButton.classList.add('valid');
      simulateButton.disabled = false;
      // Proceed with further actions if needed
    } else if(isValidNetlist === -1) {
      //console.log('Netlist is not valid.');
      simulateButton.classList.remove('valid');
      simulateButton.classList.add('invalid');
      simulateButton.disabled = true;
      valid = -1;
      // Handle invalid netlist case
    }
    else if(isValidNetlist === 0) {
      //console.log('Netlist is partial.');
      simulateButton.classList.remove('invalid');
      simulateButton.classList.add('valid');
      simulateButton.disabled = false;
      valid = 0;
      // Handle partial netlist case
    }
  } else {
    console.log('Netlist file does not exist, skipping initialization.');
  }

  document.getElementById('viewData').addEventListener('click', async () => {
    if (rawOutput !== null) {
      const tableBody = document.querySelector('#dataTable tbody');
      tableBody.innerHTML = ''; // Clear any existing rows

      // Parse the rawOutput
      const lines = rawOutput.split('\n'); // Split by lines
      const dataStartIndex = lines.findIndex(line => line.startsWith('Index')); // Locate data start
      const dataLines = lines.slice(dataStartIndex + 2, dataStartIndex + 52); // Extract the first 50 rows

      // Populate the table
      dataLines.forEach(line => {
        const columns = line.trim().split(/\s+/); // Split by whitespace
        if (columns.length === 3) {
          const row = document.createElement('tr');
          row.innerHTML = `
                    <td>${columns[0]}</td>
                    <td>${columns[1]}</td>
                    <td>${columns[2]}</td>
                `;
          tableBody.appendChild(row);
        }
      });

      // Open the modal
      openModal();
    } else {
      console.error('No raw output data available');
    }
  });

  // Function to open the modal
  function openModal() {
    document.getElementById('dataModal').style.display = 'block';
  }

  document.querySelector('.close-button').addEventListener('click', closeModal);

  // Function to close the modal
  function closeModal() {
    document.getElementById('dataModal').style.display = 'none';
  }

  document.getElementById('loadButton').addEventListener('click', async () => {

    const { filePath, fileContent } = await window.electron.openFileDialog();
    if (filePath) {

      const fileName = filePath ? filePath.split('\\').pop().split('/').pop() : 'No file selected';
      document.getElementById('fileHolder').textContent = fileName;
      document.getElementById('simulateButton').dataset.filePath = filePath;
      var isValidNetlist = validateNetlist(fileContent);

      const simulateButton = document.getElementById('simulateButton');

      if (isValidNetlist === 1) {

            //console.log('Netlist is valid.');
        valid = 1;
        simulateButton.classList.remove('invalid');
        simulateButton.classList.add('valid');
        simulateButton.disabled = false;
            // Proceed with further actions if needed
      } else if(isValidNetlist === -1) {
            //console.log('Netlist is not valid.');
        simulateButton.classList.remove('valid');
        simulateButton.classList.add('invalid');
        simulateButton.disabled = true;
        valid = -1;
            // Handle invalid netlist case
      }
      else if(isValidNetlist === 0) {
            //console.log('Netlist is partial.');
        simulateButton.classList.remove('invalid');
        simulateButton.classList.add('valid');
        simulateButton.disabled = false;
        valid = 0;
            // Handle partial netlist case
      }
    }
  });


      
  document.getElementById('simulateButton').addEventListener('click', async () => {
    const filePath = document.getElementById('simulateButton').dataset.filePath;
    if (filePath) {
      const content = await readFile(filePath);

      const validNetlist = validateNetlist(content); // Call the validateNetlist function to check the validity of the netlist

      console.log('Netlist validity: ', validNetlist);
      console.log('Netlist content: ', content);

      if (validNetlist === 1) {
        try {
          const output = await window.electron.simulateCircuit(filePath);
          rawOutput = output
          plotFromNgspiceOutput(output);
        } catch (error) {
          // Display the error in a popup
          alert(`Error from ngspice: ${error.message || error}`);
        }
        return;
      } else if (validNetlist === 0) {
        try {
          // Add data to the file before sending it to simulateCircuit
          const modifiedFileContent = await ModifyNetlist(filePath);
          const output = await window.electron.simulateCircuit(modifiedFileContent);
          rawOutput = output;
          plotFromNgspiceOutput(output);
        } catch (error) {
          // Display the error in a popup
          alert(`Error from ngspice: ${error.message || error}`);
        }
        return;
      } else {
        alert('Netlist is not valid. Please load a valid file.');
      }
    } else {
      alert('Please load a file first.');
    }
  });


  var axisRadios = document.querySelectorAll('input[type=radio][name=axisSelector]');
  axisRadios.forEach(function(radio) {
    radio.addEventListener('change', function() {
        var selectedAxis = this.value; // 'x' or 'y'
        var selectedScale = document.querySelector('input[type=radio][name=scaleSelector]:checked').value; // Get selected scale
        var selectedPlot = document.getElementById('plotSelect').value;
        // Update axis scale on chart (you need to implement this)
        updateAxisScale(selectedPlot,selectedAxis, selectedScale);
    });
    });

    document.getElementById('plotSelect').addEventListener('change', function() {
      var selectedPlot = this.value;
  });

    // Event listener for scale selection (radio buttons)
    var scaleRadios = document.querySelectorAll('input[type=radio][name=scaleSelector]');
    scaleRadios.forEach(function(radio) {
        radio.addEventListener('change', function() {

          var selectedAxis = document.querySelector('input[type=radio][name=axisSelector]:checked').value; // Get selected axis
          var selectedScale = this.value; // 'linear' or 'log'
          var selectedPlot = document.getElementById('plotSelect').value;
            // Update axis scale on chart (you need to implement this)
          updateAxisScale(selectedPlot,selectedAxis, selectedScale);
        });
        });

    const slider1 = document.getElementById('slider1');
    const input1 = document.getElementById('input1');
    syncSliderAndInput(slider1, input1);
    LinkAmplitude(slider1, input1);

    const slider2 = document.getElementById('slider2');
    const input2 = document.getElementById('input2');
    syncSliderAndInput(slider2, input2);
    linkFrequency(slider2, input2);

    const slider3 = document.getElementById('slider3');
    const input3 = document.getElementById('input3');
    syncSliderAndInput(slider3, input3);
    linkDCoffset(slider3, input3);

    document.getElementById('waveSelect').addEventListener('change', function() {
      selectedShape = this.value;
      updateGraphVals();
    })
    
});





