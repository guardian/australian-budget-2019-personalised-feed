import Handlebars from 'handlebars/dist/handlebars'
import tags_template from '../../templates/tags.html'
import pagerank from '../../templates/contented.html'
import bio_template from '../../templates/human.html'
import footer_template from '../../templates/footer.html'
import { Toolbelt } from '../modules/toolbelt'
import chroma from 'chroma-js'
import Ractive from 'ractive'
import fade from 'ractive-transitions-fade'
import xr from 'xr';
import share from '../modules/share'
import moment from 'moment'
Ractive.transitions.fade = fade
Ractive.DEBUG = false;

export class Budgetizer {

	constructor(googledoc) {

		var self = this

		this.preliminary = true

		this.previous = JSON.stringify(googledoc.data);

		this.scale = chroma.scale(['#ff9b0b','#a60947','008ae5','#66a998','#b82266','#002c59'])

		this.flipBuffet = ['slide9','slide10','slide11','slide12','slide13','slide14','slide15','slide16','slide17','slide18','slide19']

		this.flipCurrent = ['slide1','slide2','slide3','slide4','slide5','slide6','slide7','slide8']

		this.tags = []

		this.currentTags = []

		this.memory = []

		var tags = []

		this.data = googledoc.data.filter( (value) => {

				return value.status === 'confirmed'

			});

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

		this.increment = 1 / tags.length 

		this.pos = 0

		for (var i = 0; i < tags.length; i++) {

			let obj = {}
			obj.tag = tags[i]
			obj.active = false
			obj.colour = self.scale( self.pos ).hex();
			self.pos = self.pos + self.increment
			this.tags.push(obj)

		}

		this.storyCount = this.data.length

		this.bioTags = []

		this.currentBioTags = []

		this.bio = googledoc.bio

		this.bio.forEach(function(item, index) {

			item.active = false

			let filtered = self.bioTags.filter( (value) => {

				return value.group === item.group

			});

			if (filtered.length === 0) {

				let obj = {};
				obj["group"] = item.group
				obj["items"] =  [{item: item.tag, colour: item.colour}]
				self.bioTags.push(obj);

			} else {

				filtered[0].items.push({item: item.tag, colour: item.colour})

			}

		});

		this.footer = googledoc.footer

		this.toolbelt = new Toolbelt();

		this.prepBio()

	}

	updateFeed() {

		var self = this

		return window.setInterval( function() {

			var key = '1q7sAZUHXJYL0MDgK98wy-3-RXfG8cofrBJPUk_f67xA' // The actual data

			//var key = '1eJQ-D80oBr9f9a4ii0nCrh7Wh-ULiv05MZjaTDqgO-s' // Testing 1 2 3

			xr.get('https://interactive.guim.co.uk/docsdata/' + key + '.json?ga=' + new Date().getTime()).then((resp) => {

				document.querySelector("#update_time").innerHTML = "Updated: " + moment().format('ddd, MMM Do, h:mm a');

				let json = resp.data.sheets.data

	            if (self.previous !== JSON.stringify(json)) {

	            	console.log("New content")

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

					self.increment = 1 / tags.length 

					self.pos = 0

					self.tags = []

					for (var i = 0; i < tags.length; i++) {

						let obj = {}
						obj.tag = tags[i]
						obj.active = self.toolbelt.contains(self.currentTags, tags[i])
						obj.colour = self.scale( self.pos ).hex();
						self.pos = self.pos + self.increment
						self.tags.push(obj)

					}

					self.storyCount = data.length

					self.data = data

				    let tagsData = {

				      tags: self.tags

				    };

					let template = Handlebars.compile(tags_template);

					let compiledHTML = template(tagsData);

					document.querySelector("#budget_tags").innerHTML = compiledHTML

			        var tags = document.getElementsByClassName("budget");

			        var control = function() {

			            let target = this.getAttribute('data-tag');

			            if (this.classList.contains('active')) {

			            	this.classList.remove('active')

			            	self.updateTags(target, false)

			            } else {

			            	this.classList.add('active')

			            	self.updateTags(target, true)

			            }

			        };

			        for (var i = 0; i < tags.length; i++) {

			            tags[i].addEventListener('click', control, false);

			        }

			        self.filterTags();
	                
	            }
	            
			});

		}, 120000 );

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

	prepBio() {

		var self = this

	    let tagsData = {

	      group: self.bioTags

	    };

		let template = Handlebars.compile(bio_template);

		let compiledHTML = template(tagsData);

		document.querySelector("#bio").innerHTML = compiledHTML

        var tags = document.getElementsByClassName("biotag");

        var control = function() {

            let target = this.getAttribute('data-label');

            if (this.classList.contains('active')) {

            	this.classList.remove('active')

            	self.updateBioTags(target, false)

            } else {

            	this.classList.add('active')

            	self.updateBioTags(target, true)

            }

        };

        for (var i = 0; i < tags.length; i++) {

            tags[i].addEventListener('click', control, false);

        }


		this.prepCats()

	}

	prepCats() {

		var self = this

	    let tagsData = {

	      tags: self.tags

	    };

		let template = Handlebars.compile(tags_template);

		let compiledHTML = template(tagsData);

		document.querySelector("#budget_tags").innerHTML = compiledHTML

        var tags = document.getElementsByClassName("budget");

        var control = function() {

            let target = this.getAttribute('data-tag');

            if (this.classList.contains('active')) {

            	this.classList.remove('active')

            	self.updateTags(target, false)

            } else {

            	this.classList.add('active')

            	self.updateTags(target, true)

            }

        };

        for (var i = 0; i < tags.length; i++) {

            tags[i].addEventListener('click', control, false);

        }

        document.querySelector("#select_all_tags").addEventListener('click', () => {

			var tags = document.getElementsByClassName("budget");

	        for (var i = 0; i < tags.length; i++) {

	            tags[i].addEventListener('click', control, false);

				if (!tags[i].classList.contains('active')) {

					tags[i].classList.add('active')

				}

	        }

			self.tags.forEach( (item) => {

				item.active = true

			});

			self.filterTags();

		});


        document.querySelector("#deselect_all_tags").addEventListener('click', () => {

			var tags = document.getElementsByClassName("budget");

	        for (var i = 0; i < tags.length; i++) {

	            tags[i].addEventListener('click', control, false);

				if (tags[i].classList.contains('active')) {

					tags[i].classList.remove('active')

				}

	        }

			self.tags.forEach( (item) => {

				item.active = false

			});

			self.filterTags();

		});


    	this.pagerank = this.data

    	this.ractivate()

	}

	prepFooter() {

		var self = this

	    let footerData = {

	      story: self.footer

	    };

		let template = Handlebars.compile(footer_template);

		let compiledHTML = template(footerData);

		document.querySelector("#footer").innerHTML = compiledHTML


	}

	updateBioTags(target, status) {

		this.bio.filter( (item) => {

			if (item.tag === target) {

				item.active = status

			}

		});

		this.filterTags();

	}

	updateTags(target, status) {

		this.tags.filter( (item) => {

			if (item.tag === target) {

				item.active = status

			}

		});

		this.filterTags();

	}

	filterTags() {

		var self = this

		self.currentTags = []

		this.tags.forEach( (item) => {

			if (item.active) {

				self.currentTags.push(item.tag)

			}

		});

		self.currentBioTags = []

		this.bio.forEach( (item) => {

			if (item.active) {

				self.currentBioTags.push(item.tag)

			}

		});

		this.compile();

	}

	compile() {

		var self = this

		// console.log("Number of stories: " + this.data.length)

		var results 

		if (self.currentTags.length === 0 || self.currentTags.length === self.tags.length) {

			results = this.data

		} else {

			results = this.data.filter( (item) => {

				return self.toolbelt.contains(item.tags, self.currentTags)

			});

		}

		//console.log(self.tags.length)

		//console.log(self.currentTags.length)

		//console.log("Results: " + results.length)

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

		this.pagerank = results.sort(function(a, b) { return b.pagerank - a.pagerank; });

		document.querySelector("#content_count").innerHTML = `Displaying ${results.length} of ${this.storyCount} stories.`

		let display = (results.length < this.storyCount) ? 'inline-block' : 'none' ;

		document.querySelector("#content_loaded").style.display = 'block'

		document.querySelector("#reset_container").style.display = display

		self.render();

	}

	ractivate() {

		var self = this

		this.render = function () {
		  var ractive = new Ractive({
		    target: "#budget_content",
		    template: pagerank,
		  	data: { 
		  		content: self.pagerank,
				classify: function(tag) {
				  return (self.currentTags.length===0) ? 'tag active' : 'tag' + ( (self.toolbelt.contains(tag, self.currentTags)) ? ' active' : '') ;
				}
		  	}
		  });

		  ractive.set('content', self.pagerank);

		  ractive.on( 'reset', function () {
		    // Teardown, then re-render once fadeouts are complete
		    ractive.teardown( self.render );
		  });
		};

		this.filterTags();

		this.prepFooter();

		this.preload()

	}  

	preload() {

		var self = this

		this.imageSequence = []

		let size = getComputedStyle(document.querySelector('#prechecker'), ':before').getPropertyValue('content');

		console.log(size)

		var dir = (size==='small') ? '110/' : 
			(size==='medium') ? '220/' : '' ;

		let images = [1,2,3,4,5,6,8,9,10,11,12,13,14,15,16,17,18,19,20]

		for (var i = 0; i < images.length; i++) {

			var url = "https://interactive.guim.co.uk/2018/04/budget-vox-pix/" + dir  + 'budget-sign-' + images[i] + '.jpg'

			var img = new Image();

			img.src = url;

			self.imageSequence.push(img)

		}

		this.animation = this.intervalTrigger()

		this.updater = this.updateFeed()

		document.querySelector("#update_time").innerHTML = "Updated: " + moment().format('ddd, MMM Do, h:mm a');

		this.social()

	}

	getShareUrl() { 

		var isInIframe = (parent !== window);
		var parentUrl = null;
		var shareUrl = (isInIframe) ? document.referrer : window.location.href;
		shareUrl = shareUrl.split('?')[0]
		return shareUrl;

	}

	social() {

		var self = this

		// title, shareURL, fbImg, twImg, hashTag

		var title = "The complete 2019 Australian budget: choose what matters to you";

		var shareFn = share(title, self.getShareUrl(), null, null, '#Budget2019 #auspol');

		document.querySelector("#zucker").addEventListener('click',() => shareFn('facebook'));

		document.querySelector("#twitter").addEventListener('click',() => shareFn('twitter'));

	}

}