import Handlebars from 'handlebars/dist/handlebars'
import tags_template from '../../templates/tags.html'
import pagerank from '../../templates/contented.html'
import bio_template from '../../templates/human.html'
import { Toolbelt } from '../modules/toolbelt'
import chroma from 'chroma-js'
import Ractive from 'ractive'

export class Budgetizer {

	constructor(googledoc) {

		var self = this

		this.scale = chroma.scale(['#ff9b0b','#a60947','008ae5','#66a998','#b82266','#002c59'])

		this.tags = googledoc.tags

		this.increment = 1 / this.tags.length 

		this.pos = 0

		this.tags.forEach(function(item, index) {

			item.active = true

			item.colour = self.scale( self.pos ).hex();

			self.pos = self.pos + self.increment

		})

		this.currentTags = []

		this.data = googledoc.data

		this.data.forEach(function(item, index) {

			item.cats = item.tags.split(','); 

			item.html = self.htmlify(item.description)

		});

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

        //this.filterTags() // First run... Switch oiff if template is preloaded with HTML

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

		var results = this.data.filter( (item) => {

			return self.toolbelt.contains(item.tags, self.currentTags)

		});

		results.forEach( (item, index) => {

			// Matching tags

			let matches =  self.toolbelt.match_array( item.tags, self.currentTags)

			// All tags

			let arr = item.tags.split(','); 

			// Total number of tags

			let total = arr.length

			// Give more weighting to items that ruturn multiple category matches but don't discriminate against items with only one or two category tags

			let multiplier = ( matches.length / total ) + 1.5

			// Matching tags

			let connections =  self.toolbelt.match_array( item.biographic, self.currentBioTags)

			// console.log("Connections: " + connections.length)

			// The pagerank algorithm...

			item.pagerank = ( matches.length * multiplier ) + (item.importance) + connections.length

			// console.log( matches.length + ' | ' +  total + ' | ' + multiplier + ' | ' + multiplier + ' | ' + (matches.length * multiplier))

		});

		this.pagerank = results.sort(function(a, b) { return b.pagerank - a.pagerank; });

		this.ractive.set('content', self.pagerank);

	}

	ractivate() {

		var self = this

		this.ractive = Ractive({
		  	target: "#budget_content",
		  	template: pagerank,
		  	data: { 
		  		content: self.pagerank,
				classify: function(tag) {
				  return 'tag' + ( (self.toolbelt.contains(tag, self.currentTags)) ? ' active' : '') ;
				}

		  	}
		});

	}

}