// Imports
import { AddResistor } from "./components/loads/resistor.js";
import { AddCapacitor } from "./components/loads/capacitor.js";
import { AddInductor } from "./components/loads/inductor.js";
import { AddVoltage } from "./components/sources/voltage.js";
import { AddDiode } from "./components/diodes/diode.js";
import { AddGround } from "./components/common/ground.js";
import { AddZener } from "./components/diodes/zener.js";
import { AddLED } from "./components/diodes/led.js";
import { AddThyristor } from "./components/diodes/thyristor.js";

// Listeners

// Loads
document.getElementById('resistor_btn').addEventListener('click', function () {
    AddResistor();
});

document.getElementById('capacitor_btn').addEventListener('click', function () {
    AddCapacitor();
});

document.getElementById('inductor_btn').addEventListener('click', function () {
    AddInductor();
});

document.getElementById('gen_diode').addEventListener('click', function () {
    AddDiode();
});

document.getElementById('zen_diode').addEventListener('click', function () {
    AddZener();
});

document.getElementById('led_diode').addEventListener('click', function () {
    AddLED();
});

// document.getElementById('thyristor_diode').addEventListener('click', function () {
//     AddThyristor();
// });

document.getElementById('gnd_btn').addEventListener('click', function () {
    AddGround();
});

document.getElementById('volt_btn').addEventListener('click', function () {
    AddVoltage();
});

// Get all menu items
const menuItems = document.querySelectorAll('.menu-item');

// Loop through each menu item
menuItems.forEach(menuItem => {
    // Add click event listener to each menu item
    menuItem.addEventListener('click', function () {
        // Find the corresponding submenu
        const submenu = this.nextElementSibling;

        document.querySelectorAll('.submenu').forEach(otherSubmenu => {
            if (otherSubmenu !== submenu) {
                otherSubmenu.style.display = 'none';
            }
        });

        // Toggle the display of the submenu
        if (submenu.style.display === 'none' || submenu.style.display === '') {
            submenu.style.display = 'block';
        } else {
            submenu.style.display = 'none';
        }
    });
});

