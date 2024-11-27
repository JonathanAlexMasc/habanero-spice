  // Get all menu items
  const menuItems = document.querySelectorAll('.menu-item');

  // Loop through each menu item
  menuItems.forEach(menuItem => {
      // Add click event listener to each menu item
      menuItem.addEventListener('click', function() {
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