import xr from 'xr';
import { Budgetizer } from './modules/budgetizer'

xr.get('https://interactive.guim.co.uk/docsdata/1eJQ-D80oBr9f9a4ii0nCrh7Wh-ULiv05MZjaTDqgO-s.json').then((resp) => {

	let googledoc = resp.data.sheets;

	new Budgetizer(googledoc)
});
