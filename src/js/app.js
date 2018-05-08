import xr from 'xr';
import { Budgetizer } from './modules/budgetizer'

// process.env.PATH + '/assets/1IKIp4NOuOfOwaduHiutgTvc55joO3DElR3W0k4aAHPU.json'

var key = '1IKIp4NOuOfOwaduHiutgTvc55joO3DElR3W0k4aAHPU' // The actual data

// var key = '1eJQ-D80oBr9f9a4ii0nCrh7Wh-ULiv05MZjaTDqgO-s' // Testing data

xr.get('https://interactive.guim.co.uk/docsdata/' + key + '.json').then((resp) => {

	let googledoc = resp.data.sheets;

	new Budgetizer(googledoc)
});

