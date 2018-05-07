import xr from 'xr';
import { Budgetizer } from './modules/budgetizer'

xr.get('https://interactive.guim.co.uk/docsdata/1IKIp4NOuOfOwaduHiutgTvc55joO3DElR3W0k4aAHPU.json').then((resp) => {

	let googledoc = resp.data.sheets;

	new Budgetizer(googledoc)
});
