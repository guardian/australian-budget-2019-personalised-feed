import Handlebars from 'handlebars/dist/handlebars'
import tags_template from '../../templates/tags.html'
import pagerank from '../../templates/contented.html'
import bio_template from '../../templates/human.html'
import { Toolbelt } from '../modules/toolbelt'
import chroma from 'chroma-js'
import Ractive from 'ractive'
import fade from 'ractive-transitions-fade'
Ractive.transitions.fade = fade

export class Budgetizer {

	constructor(googledoc) {

		var self = this

		this.scale = chroma.scale(['#ff9b0b','#a60947','008ae5','#66a998','#b82266','#002c59'])

		/*

		this.tags = googledoc.tags

		this.increment = 1 / this.tags.length 

		this.pos = 0

		this.tags.forEach(function(item, index) {

			item.active = true

			item.colour = self.scale( self.pos ).hex();

			self.pos = self.pos + self.increment

		})

		*/

		this.tags = []

		this.currentTags = []

		var tags = []

		this.data = googledoc.data

		this.data.forEach(function(item, index) {

			let arr = item.tags.split(','); 

			item.cats = arr

			for (var i = 0; i < arr.length; i++) {

				let tag = arr[i].trim()

				tags.indexOf(tag) === -1 ? tags.push(tag) : '';

			}

			item.html = self.htmlify(item.description)

		});

		this.increment = 1 / tags.length 

		this.pos = 0

		for (var i = 0; i < tags.length; i++) {

			let obj = {}
			obj.tag = tags[i]
			obj.active = true
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
				obj["items"] =  [item.tag]
				self.bioTags.push(obj);

			} else {

				filtered[0].items.push(item.tag)

			}

		});

		this.toolbelt = new Toolbelt();

		this.prepBio()

	}

	htmlify(string) {

		var content = '<p>' + string.replace(/\n([ \t]*\n)+/g, '</p><p>').replace('\n', '<br />') + '</p>';

		content = content.replace(/<\/p>/, '</p><span class="read-more-target">')

	  	return content + '</span>'

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

        document.querySelector("#reset_tags").addEventListener('click', () => {

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

        this.pagerank = this.data

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

		console.log("Number of stories: " + this.data.length)

		console.log(self.currentTags)

		var results = this.data.filter( (item) => {

			console.log(item.tags)

			return self.toolbelt.contains(item.tags, self.currentTags)

		});

		console.log("Results: " + results.length)

		results.forEach( (item, index) => {

			// Matching tags

			let matches =  self.toolbelt.match_array( item.tags, self.currentTags)

			// All tags

			let arr = item.tags.split(','); 

			// Total number of tags

			let total = arr.length

			// Give more weighting to items that ruturn multiple category matches but don't discriminate too much against items with only one or two category tags

			let multiplier = ( matches.length / total ) + 1.5

			// Identity markers

			let connections =  self.toolbelt.match_array( item.biographic, self.currentBioTags)

			// If they have selected category tags give less weight to the original importance ranking

			let rank = (self.currentTags > 0) ? item.importance / ( self.currentTags / 2 ) : item.importance ;

			// The pagerank algorithm...

			item.pagerank = ( matches.length * multiplier ) + rank + ( connections.length * 6 )

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