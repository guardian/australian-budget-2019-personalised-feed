import Handlebars from 'handlebars/dist/handlebars'
import tags_template from '../../templates/tags.html'
import pagerank from '../../templates/contented.html'
import bio_template from '../../templates/human.html'
import footer_template from '../../templates/footer.html'
import { Toolbelt } from '../modules/toolbelt'
import chroma from 'chroma-js'
import Ractive from 'ractive'
import fade from 'ractive-transitions-fade'
Ractive.transitions.fade = fade

export class Budgetizer {

	constructor(googledoc) {

		var self = this

		this.scale = chroma.scale(['#ff9b0b','#a60947','008ae5','#66a998','#b82266','#002c59'])

		this.flipBuffet = ['slide9','slide10','slide11','slide12','slide13','slide14','slide15','slide16','slide17','slide18','slide19']

		this.flipCurrent = ['slide1','slide2','slide3','slide4','slide5','slide6','slide7','slide8']

		this.tags = []

		this.currentTags = []

		var tags = []

		this.data = googledoc.data

		this.data.forEach(function(item, index) {

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

    	this.animation = this.intervalTrigger()

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

        this.prepFooter()

	}

	prepFooter() {

		var self = this

	    let footerData = {

	      story: self.footer

	    };

		let template = Handlebars.compile(footer_template);

		let compiledHTML = template(footerData);

		document.querySelector("#footer").innerHTML = compiledHTML

		this.ractivate()

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

		// console.log(self.currentTags)

		var results 

		if (self.currentTags.length === 0) {

			results = this.data

		} else {

			results = this.data.filter( (item) => {

				//console.log(item.tags)

				return self.toolbelt.contains(item.tags, self.currentTags)

			});

		}

		// console.log("Results: " + results.length)

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
				  return 'tag' + ( (self.toolbelt.contains(tag, self.currentTags)) ? ' active' : '') ;
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

	}

}