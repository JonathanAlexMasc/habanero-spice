// forge.config.js
const path = require('path');
module.exports = {
    packagerConfig: {
        asar: true
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                bin: 'Habanero Spice'
            }
        },
        {
            name: '@electron-forge/maker-dmg',
            config: {
                bin: 'Habanero Spice'
            }
        },
        {
            name: '@electron-forge/maker-deb',
            config: {
                bin: 'Habanero Spice'
            }
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {
                bin: 'Habanero Spice'
            }
        }
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-auto-unpack-natives',
            config: {}
        }
    ],
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'JonathanAlexMasc',
                    name: 'habanero-spice'
                },
                prerelease: true
            }
        }
    ]
};