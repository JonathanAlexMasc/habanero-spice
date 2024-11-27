var numPoints = 500;
var valid = -1;
// Generate initial sine wave data
var xData = [];
var yData = [];
var dx = 2 * Math.PI / numPoints;

//for file input
var data = {
  frequency: [],
  dB: []
};

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

    // Remove --partial line
    existingContent = existingContent.replace(/^--partial\s*[\r\n]*/m, '');

    existingContent = existingContent.replace(/\bInductor(\d*)\b/g, 'LInductor$1');

    // Replace [fill] with SINE wave parameters
    const updatedContent = existingContent.replace('[fill]', `SINE (${dcOff} ${amplitude} ${frequency}k)`);

    // Construct new content with updated string and control section
    const newContent = `\n${updatedContent.trim()}\n\n${controlSection}\n.end`;

    // Change the file extension to .cir
    const newFilePath = filePath.replace(/\.[^/.]+$/, ".cir");

    // Write the modified content back to the new file
    await writeFile(newFilePath, newContent);
    console.log('Netlist modified successfully.');
    return newFilePath;
  } catch (error) {
    console.error('Error modifying netlist:', error);
  }
}




// Initialize syncing for each slider and input pair
document.addEventListener('DOMContentLoaded', async () => {

  var validSim = document.getElementById('simulateButton');
  validSim.classList.remove('valid');
  validSim.classList.add('invalid');
  validSim.disabled = true;

  const netlistPath = './Files/netlist.txt';
  
  const fileExists = window.electron.checkFileExists(netlistPath);
  
  if (fileExists) { // File exists
    const netlistContent = await readFile(netlistPath);
    const isValidNetlist = validateNetlist(netlistContent);
    document.getElementById('fileHolder').textContent = 'netlist.txt';
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

      var validnetlist = validateNetlist(content); // Call the validateNetlist function to check the validity of the netlist
          
      console.log(validateNetlist);
      console.log('Netlist content: ', content);
      if (validnetlist === 1) {
        try {
          const output = await window.electron.simulateCircuit(filePath);
          plotFromNgspiceOutput(output);
        } catch (error) {
          //document.getElementById('output').textContent = `Error: ${error}`;
        }
        return;
      } else if (validnetlist === 0) {
            // Add data to the file before sending it to simulateCircuit
        const modifiedFileContent = await ModifyNetlist(filePath);
        const content = await readFile(filePath);
        console.log('Netlist content: ', content);
            //console.log('Netlist content: ', modifiedFileContent);
        try {
          const output = await window.electron.simulateCircuit(modifiedFileContent);
          plotFromNgspiceOutput(output);
        } catch (error) {
          //document.getElementById('output').textContent = `Error: ${error}`;
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



