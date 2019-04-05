import xr from 'xr';
import { Budgetizer } from './modules/budgetizer'

var testing = process.env.PATH + '/assets/1q7sAZUHXJYL0MDgK98wy-3-RXfG8cofrBJPUk_f67xA.json'

var key = '1q7sAZUHXJYL0MDgK98wy-3-RXfG8cofrBJPUk_f67xA'

var year = 2019

var social = [{

	"title" : `The complete ${year} Australian budget: choose what matters to you`,

	"url" : "https://www.theguardian.com/australia-news/ng-interactive/2019/apr/02/the-complete-2019-australian-federal-budget-choose-what-matters-to-you",

	"fbImg" : null,

	"twImg" : null,

	"twHash" : `#Budget${year} #auspol`,

	"message" : "Build your own budget coverage by choosing the topics you’re interested in. You can also put in some optional biographic information which will be used to rank the news items. Or, leave the buttons alone for the Guardian Australia-selected order"

}]

xr.get('https://interactive.guim.co.uk/docsdata/' + key + '.json').then((resp) => {

	let googledoc = resp.data.sheets;

	new Budgetizer(googledoc, key, year, social)
	
});
