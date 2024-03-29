import { Builder, By } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome.js';
import fs from 'fs';
import Bot from './bot.js';

const screen = {
    width: 1920,
    height: 1080,
};

let screenshotIndex = 0;
let driver;

async function takeScreenshot(driver) {
    driver.takeScreenshot().then(function (image, err) {
        if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots');
        fs.writeFile('screenshots/out' + screenshotIndex++ + '.png', image, 'base64', function (err) {
            console.log(err);
        });
    });
}

async function loadCatering() {
    driver = await new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options().headless().windowSize(screen)).build();
    await driver.get('https://siemens.cateringportal.io/menu/Stuttgart%20S/Mittagessen');
    await driver.manage().addCookie({ name: 'qnips_language', value: 'de-DE' });
    await driver.get('https://siemens.cateringportal.io/menu/Stuttgart%20S/Mittagessen');
    await driver.wait(function () {
        return driver.findElements(By.css('h3.category-header.ng-star-inserted')).then((found) => !!found.length);
    }, 20 * 1000);
    //await takeScreenshot(driver);
}

export const getTodaysFood = async () => {
    await loadCatering();
    let els = await driver.findElements(By.css('div.name-column.pad-right-sm.pad-bottom-sm.text-xxl .pre-wrap'));
    console.log(els.length);
    els = [await els[0].getText(), await els[1].getText()];
    driver.close();
    return els;
}

export const registerIntents = () => {
    Bot.getInstance().da.onIntent("SIEMENS_FOOD", async()=>{
        Bot.getInstance().tts.synthesizeSpeech("Ich schau mal");
        console.log('Loading food...');
        let food = await getTodaysFood();
        console.log('Heute:');
        console.log('Vegetarisch: ------------\n', food[0]);
        console.log('Fleisch:  ------------\n', food[1]);

        Bot.getInstance().tts.synthesizeSpeech("Heute gibt es als Vegetarisches Gericht:" + food[0] + " und als Fleisch Gericht: " + food[1]);
    })
}

// (async function example() {
//     try {
//         await driver.get('https://siemens.cateringportal.io/menu/Stuttgart%20W/Mittagessen');
//         await driver.manage().addCookie({ name: 'qnips_language', value: 'de-DE' });
//         await driver.wait(function () {
//             return driver.findElements(By.css('h3.category-header.ng-star-inserted')).then((found) => !!found.length);
//         }, 20 * 1000);
//         await takeScreenshot(driver);
//         let els = await driver.findElements(By.css('div.name-column.pad-right-sm.pad-bottom-sm.text-xxl .pre-wrap'));
//         console.log(els.length);
//         console.log(await els[0].getText());
//         console.log(await els[1].getText());
//         await takeScreenshot(driver);
//     } finally {
//         await driver.quit();
//     }
// })();
