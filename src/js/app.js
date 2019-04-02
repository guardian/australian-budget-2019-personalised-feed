import xr from 'xr';
import { Budgetizer } from './modules/budgetizer'

var testing = process.env.PATH + '/assets/1q7sAZUHXJYL0MDgK98wy-3-RXfG8cofrBJPUk_f67xA.json'

// 1q7sAZUHXJYL0MDgK98wy-3-RXfG8cofrBJPUk_f67xA

var key = '1q7sAZUHXJYL0MDgK98wy-3-RXfG8cofrBJPUk_f67xA' // The actual data

// var key = '1eJQ-D80oBr9f9a4ii0nCrh7Wh-ULiv05MZjaTDqgO-s' // Testing data

xr.get('https://interactive.guim.co.uk/docsdata/' + key + '.json').then((resp) => {

	let googledoc = resp.data.sheets;

	new Budgetizer(googledoc)
});

// xr.get(testing).then((resp) => {

// 	let googledoc = resp.data.sheets;

// 	new Budgetizer(googledoc)
// });
