const { test, expect, _electron: electron } = require('@playwright/test')

test('verify document title', async () => {
    const electronApp = await electron.launch({ args: ['.'] })

    // Wait for the first BrowserWindow to open
    const window = await electronApp.firstWindow()

    // Check the document title
    const title = await window.title();
    expect(title).toBe("Habanero Spice");

    // Close the app
    await electronApp.close()
})

test('get build page details', async () => {
    const electronApp = await electron.launch({ args: ['.'] })

    // Wait for the first BrowserWindow to open
    const window = await electronApp.firstWindow()

    // Wait for the button with id="build" to appear
    await window.waitForSelector('#build');
    await window.click('#build');

    const title = await window.title();
    expect(title).toBe("Spice Build");

    // Close the app
    await electronApp.close()
})

test('get run page details', async () => {
    const electronApp = await electron.launch({ args: ['.'] })

    // Wait for the first BrowserWindow to open
    const window = await electronApp.firstWindow()

    // Wait for the button with id="build" to appear
    await window.waitForSelector('#run');
    await window.click('#run');

    const title = await window.title();
    expect(title).toBe("Spice Run");

    // Close the app
    await electronApp.close()
})