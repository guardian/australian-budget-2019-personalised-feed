import template from '../../templates/template.html'
import { Toolbelt } from '../modules/toolbelt'
import chroma from 'chroma-js'
import Ractive from 'ractive'
import ractiveTap from 'ractive-events-tap'
import fade from 'ractive-transitions-fade'
import xr from 'xr';
import share from '../modules/share'
import moment from 'moment'
Ractive.transitions.fade = fade
Ractive.DEBUG = false;

export class Budgetizer {

	constructor(googledoc, key, year, socialization) {

		var self = this

		this.key = key

		this.socialization = socialization[0]

		this.toolbelt = new Toolbelt();

		this.preliminary = true

		this.previous = JSON.stringify(googledoc.data);

		this.scale = chroma.scale(['#ff9b0b','#a60947','#008ae5','#66a998','#b82266','#002c59'])

		this.flipBuffet = ['slide9','slide10','slide11','slide12','slide13','slide14','slide15','slide16','slide17','slide18','slide19']

		this.flipCurrent = ['slide1','slide2','slide3','slide4','slide5','slide6','slide7','slide8']

		this.tags = []

		this.currentTags = []

		this.memory = []

		this.bioTags = []

		this.currentBioTags = []

		this.data = googledoc.data.filter( (value) => value.status === 'confirmed')

		this.storyCount = this.data.length

		this.bio = googledoc.bio

		this.database = {

			year: year,

			biotags: [],

			bio: [],

			tags: [],

			content: [],

			footer : googledoc.footer,

			updated: moment().format('ddd, MMM Do, h:mm a'),

			total: self.data.length,

			results: self.data.length,

			showSelectAll: true,

			showDeselectAll: false,

			classify: function(tag) {

			  return (self.currentTags.length===0) ? 'tag active' : 'tag' + ( (self.toolbelt.contains(tag, self.currentTags)) ? ' active' : '') ;
			
			}

		}

		this.init()

	}

	init() {

		var self = this

		var tags = []

		this.data.forEach(function(item, index) {

			item.id = +item.id

			self.memory.push(item.id)

			item.exists = true

			let arr = item.tags.split(','); 

			item.cats = arr

			for (var i = 0; i < arr.length; i++) {

				let tag = arr[i].trim()

				tags.indexOf(tag) === -1 && tag != '' ? tags.push(tag) : ''; 

			}

			let status = self.htmlify(item.description, item.url, item.linktext)

			item.html = status.content

			item.solo = status.solo

		});

		let increment = 1 / tags.length 

		let pos = 0

		for (let i = 0; i < tags.length; i++) {

			let obj = {}
			obj.tag = tags[i]
			obj.active = false
			obj.colour = self.scale( pos ).hex();
			pos = pos + increment
			this.tags.push(obj)

		}

		this.bio.forEach(function(item, index) {

			item.active = false

			let filtered = self.bioTags.filter( (value) => value.group === item.group);

			if (filtered.length === 0) {

				let obj = {};
				obj["gid"] = self.bioTags.length
				obj["group"] = item.group
				obj["items"] =  [{group: item.group, item: item.tag, colour: item.colour, active: false }]
				self.bioTags.push(obj);

			} else {

				filtered[0].items.push({group: item.group, item: item.tag, colour: item.colour, active: false})

			}

		});

		this.database.biotags = self.bioTags

		this.database.bio = self.bio

		this.database.tags = self.tags

		this.database.content = self.data

		this.ractivate()

	}

	ractivate() {

		var self = this

        this.ractive = new Ractive({
            events: { 
                tap: ractiveTap,
            },
            el: '#app',
            data: self.database,
            template: template,
        })

        this.ractive.on('selecticle', (context) => {

			self.database.tags.forEach( (item) => item.active = true);

			self.database.showSelectAll = false

			self.database.showDeselectAll = true

			self.filterTags();

        })

        this.ractive.on('deselecticle', (context) => {

			self.database.tags.forEach( (item) => item.active = false );

			self.database.showSelectAll = true

			self.database.showDeselectAll = false

			self.filterTags();

        })

        this.ractive.on('biotag', (context, tag, group) => {

        	var status = (context.node.classList.contains('active')) ? false : true ;

        	self.updateBioTags(tag, status, group)

        })

        this.ractive.on('budget', (context, tag) => {

        	var status = (context.node.classList.contains('active')) ? false : true ;

        	self.updateTags(tag, status)

        })

		this.preload()

	}  

	preload() {

		var self = this

		this.imageSequence = []

		const dir = '220/'

		let images = [1,2,3,4,5,6,8,9,10,11,12,13,14,15,16,17,18,19,20]

		for (var i = 0; i < images.length; i++) {

			var url = "https://interactive.guim.co.uk/2018/04/budget-vox-pix/" + dir  + 'budget-sign-' + images[i] + '.jpg'

			var img = new Image();

			img.src = url;

			self.imageSequence.push(img)

		}

		this.animation = this.intervalTrigger()

		this.updater = this.updateFeed()

		this.social()

	}

	social() {

		var self = this

		var shareFn = share(self.socialization.title, self.socialization.url, self.socialization.fbImg, self.socialization.twImg, self.socialization.twHash, self.socialization.message);

		document.querySelector("#zucker").addEventListener('click',() => shareFn('facebook'));

		document.querySelector("#twitter").addEventListener('click',() => shareFn('twitter'));

	}

	intervalTrigger() {

		var self = this

		return window.setInterval( function() {

			var flipper = document.getElementsByClassName("flip-container")

			let random = (Math.floor(Math.random() * 4) + 1) - 1

			let front = flipper[random].getAttribute('data-front')

			let back = flipper[random].getAttribute('data-back')

			let id = ''

			let fo = ''

			let fn = self.flipBuffet[0]

			self.flipBuffet.shift(); // First item from array

			if (flipper[random].classList.contains('hover')) {

				id = 'fb' + random

				fo = back

				flipper[random].setAttribute("data-back", fn);

			} else {

				id = 'ff' + random

				fo = front

				flipper[random].setAttribute("data-front", fn);

			}

			var index = self.flipCurrent.indexOf(fo);

			if (index !== -1) self.flipCurrent.splice(index, 1);

			self.flipBuffet.push(fo)

			self.flipCurrent.push(fn)

			flipper[random].classList.toggle("hover");

			document.querySelector("#" + id).classList.remove(fo);

			document.querySelector("#" + id).classList.add(fn);

		}, 1500 );

	}

	htmlify(string,url,label) {

		let solo = false

		var content = '<p>' + string.replace(/\n([ \t]*\n)+/g, '</p><p>').replace('\n', '<br />') + '</p>';

		if (content.split("</p><p>").length > 1) {

			let finale = '</span>'

			if (url!='') {

				finale = '<a href="'+ url +'" target="_blank"><div class="curl">'+ label +'</div></a></span>' ;

			} else {

				finale = '<div class="supplental">' + label + '</div>'

			}

			content = content.replace(/<\/p>/, '</p><span class="read-more-target">') + finale

		} else {

			solo = true

		}

	  	return { content: content , solo: solo }

	}

	updateBioTags(target, status, group) {

		this.database.bio.filter( (item) => {

			if (item.tag === target) {

				item.active = status

			}

		});

		this.database.biotags.filter( (item) => {

			if (item.group === group) {

				item.items.filter( (el) => {

					if (el.item === target) {

						el.active = status

					}

				});

			}

		});

		this.filterTags();

	}

	updateTags(target, status) {

		this.database.tags.filter( (item) => {

			if (item.tag === target) {

				item.active = status

			}

		});

		this.filterTags();

	}

	filterTags() {

		var self = this

		self.currentTags = []

		this.database.tags.forEach( (item) => {

			if (item.active) {

				self.currentTags.push(item.tag)

			}

		});

		self.currentBioTags = []

		this.database.bio.forEach( (item) => {

			if (item.active) {

				self.currentBioTags.push(item.tag)

			}

		});

		this.compile();

	}

	compile() {

		var self = this

		var results 

		if (self.currentTags.length === 0 || self.currentTags.length === self.tags.length) {

			results = this.data

		} else {

			results = this.data.filter( (item) => {

				return self.toolbelt.contains(item.tags, self.currentTags)

			});

		}

		results.forEach( (item, index) => {

			// Matching tags

			let matches =  self.toolbelt.match_array( item.tags, self.currentTags)

			// All tags

			let arr = item.tags.split(','); 

			// Total number of tags

			let total = arr.length

			// Give more weighting to items that ruturn multiple category matches but don't discriminate too much against items with only one or two category tags

			let multiplier = ( matches.length / total ) + 1

			// Identity markers

			let connections =  self.toolbelt.match_array( item.biographic, self.currentBioTags)

			// If they have selected category tags give less weight to the original importance ranking

			let rank = (self.currentTags.length === 0 || self.currentTags.length === 0 && self.currentBioTags.length === 0) ? item.importance : item.importance / ( self.currentTags.length / 2 ) ;

			// The pagerank algorithm...

			item.pagerank = ( matches.length * multiplier ) + rank + ( connections.length * 10 )

			// console.log( matches.length + ' | ' +  total + ' | ' + multiplier + ' | ' + multiplier + ' | ' + (matches.length * multiplier))

		});

		self.database.content = results.sort( (a, b) => b.pagerank - a.pagerank);

		self.database.results = results.length

		self.database.showSelectAll = (self.currentTags.length < self.database.tags.length) ? true : false ;

		self.database.showDeselectAll = (self.currentTags.length > 0) ? true : false ;

		self.ractive.set(self.database)

	}

	updateFeed() {

		var self = this

		return window.setInterval( function() {

			xr.get('https://interactive.guim.co.uk/docsdata/' + self.key + '.json?ga=' + new Date().getTime()).then((resp) => {

				self.database.updated = moment().format('ddd, MMM Do, h:mm a');

				let json = resp.data.sheets.data

	            if (self.previous !== JSON.stringify(json)) {

	            	self.processFeed(json)
	                
	            }
	            
			});

		}, 120000 );

	}

	processFeed(json) {

		var self = this

    	self.previous = JSON.stringify(json)               

		var tags = []

		var data = json.filter( (value) => {

				return value.status === 'confirmed'

			});

		data.forEach(function(item, index) {

			item.id = +item.id

			item.exists = self.toolbelt.contains(self.memory, item.id)

			self.memory.indexOf(item.id) === -1 && item.id != '' ? self.memory.push(item.id) : ''; 

			let arr = item.tags.split(','); 

			item.cats = arr

			for (var i = 0; i < arr.length; i++) {

				let tag = arr[i].trim()

				tags.indexOf(tag) === -1 && tag != '' ? tags.push(tag) : ''; 

			}

			let status = self.htmlify(item.description, item.url, item.linktext)

			item.html = status.content

			item.solo = status.solo

		});

		let increment = 1 / tags.length 

		let pos = 0

		self.tags = []

		for (let i = 0; i < tags.length; i++) {

			let obj = {}
			obj.tag = tags[i]
			obj.active = self.toolbelt.contains(self.currentTags, tags[i])
			obj.colour = self.scale( pos ).hex();
			pos = pos + increment
			self.tags.push(obj)

		}

		self.storyCount = data.length

		self.data = data

		self.database.tags = self.tags

        self.filterTags();

	}

}