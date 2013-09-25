const Cinnamon = imports.gi.Cinnamon;
const Desklet = imports.ui.desklet;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;
const St = imports.gi.St;

function MyDesklet(metadata, desklet_id){
    this._init(metadata, desklet_id);
}

MyDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata, desklet_id){
        Desklet.Desklet.prototype._init.call(this, metadata, desklet_id);


	this.metadata = metadata;

	 try {
            this.settings = new Settings.DeskletSettings(this, this.metadata["uuid"], this.instance_id);

            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "file",
                                     "file",
                                     this.on_quote_file_changed,
                                     null);
            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "delay",
                                     "delay",
                                     this.on_timeout_changed,
                                     null);
            this.settings.bindProperty(Settings.BindingDirection.IN,
                                     "quoteSeparator",
                                     "sep",
                                     this.on_separator_changed,
                                     null);
	} catch (e) {
            global.logError(e);
        } 

        this._quoteContainer = new St.BoxLayout({vertical:true, style_class: 'quote-container'});
        this._quote = new St.Label();

	this._quoteContainer.add(this._quote);
        this.setContent(this._quoteContainer);
        this.setHeader(_("Quote"));
	
	this.on_quote_file_changed();
	this.on_timeout_changed();
	this.on_separator_changed();
    },

    on_desklet_removed: function() {
	Mainloop.source_remove(this.timeout);
    },
   
    on_quote_file_changed: function() {
       this.file = this.file.replace('~', GLib.get_home_dir());
       this._updateQuote();
    },
    
    on_timeout_changed: function() {
       // TODO: *delay by 60
       this.timeout = 
	  Mainloop.timeout_add_seconds(this.delay, Lang.bind(this, this._updateQuote));
    },

    on_separator_changed: function() {
       // Ensure the separator is a single character
       if (this.sep.length > 1)
	  this.sep = this.sep.charAt(0);
       else if (this.sep.length === 0)
	  this.sep = "%";
       
       this._updateQuote();
    },

    _updateQuote: function(){
       // Since we update infrequently, reread the file in case it has changed.
       // TODO: error handling here, e.g. in case file doesn't exist?
       let quoteFileContents = Cinnamon.get_file_contents_utf8_sync(this.file);
       let allQuotes = quoteFileContents.toString();

       // TODO: Limit the size of the string displayed?

       // Verify that the file is properly formatted with at least one separator
       if (allQuotes.indexOf(this.sep) === -1) {
	  this._quote.set_text("");
	  return;
       }

       // Ensure first and last chars are 'sep', for symmetry
       if (allQuotes.charAt(0) !== this.sep) {
	  allQuotes = this.sep + allQuotes;
       }
       if (allQuotes.lastIndexOf(this.sep) !== allQuotes.length - 1) {
	  allQuotes = allQuotes + this.sep;
       }
       this._quoteFileString = allQuotes;

       // Now find the beginning and end of each quotation
       this._findSeparators();

       // Choose a quote randomly, subtract 1 so we don't select the ending separator 
       let index = Math.floor(Math.random() * (this._separators.length - 1));

       // Parse chosen quote for display
       let substring = allQuotes.substring(
	     this._separators[index] + 1, this._separators[index+1]);
       this._quote.set_text(substring);
      
       // call _updateQuote again after this.delay minutes 
       this.timeout = 
	  Mainloop.timeout_add_seconds(this.delay, Lang.bind(this, this._updateQuote));
    },
    
    _findSeparators: function(){
       this._separators = [];
       let index = 0;
       let allQuotes = this._quoteFileString;

       while (index < allQuotes.length) {
	  index = allQuotes.indexOf(this.sep, index);
	  if (index === -1)
	     break;  // no more separators
	  this._separators.push(index);
	  index++;
       }
    }
}

function main(metadata, desklet_id){
    let desklet = new MyDesklet(metadata, desklet_id);
    return desklet;
}
