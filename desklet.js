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
	} catch (e) {
            global.logError(e);
        } 

        this._quoteContainer = new St.BoxLayout({vertical:true, style_class: 'quote-container'});
        this._quote = new St.Label();

	this._quoteContainer.add(this._quote);
        this.setContent(this._quoteContainer);
        this.setHeader(_("Quote"));
	
	this.on_quote_file_changed();
        this._updateQuote();
    },

    on_desklet_removed: function() {
	Mainloop.source_remove(this.timeout);
    },
   
    on_quote_file_changed: function() {
       this.file = this.file.replace('~', GLib.get_home_dir());
    },

    _updateQuote: function(){
       try {
       // Since we update infrequently, reread the file in case it has changed.
       // TODO: error handling here, e.g. in case file doesn't exist?
       let quoteFileContents = Cinnamon.get_file_contents_utf8_sync(this.file);
       this._quoteFileString = quoteFileContents.toString();

       // Ensure first char is '%'
       // TODO: Probably want to ensure the last is also %, for symmetry
       if (this._quoteFileString.charAt(0) !== '%') {
	  this._quoteFileString = '%' + this._quoteFileString;
       }

       // Now count the number of quotes
       this._countQuotes();

       // Choose a quote randomly
       let quoteIndex = Math.floor(Math.random() * this._quoteSeparators.length);

       // Parse chosen quote for display
       let firstIndex = this._quoteFileString.indexOf("%");
       let secondIndex = this._quoteFileString.indexOf("%", firstIndex + 1);
      
       // TODO: This won't work for the last % if we exclude it from the quoteSep array 
       let substring = this._quoteFileString.substring(
	     this._quoteSeparators[quoteIndex] + 1, this._quoteSeparators[quoteIndex+1]);
       this._quote.set_text(substring);

       // TODO: get timeout from settings
       this.timeout = Mainloop.timeout_add_seconds(500, Lang.bind(this, this._updateQuote));
       }catch(e){
	  global.logError(e);
       }
    },
    
    _countQuotes: function(){
       // TODO: Now we're not just counting, we're making an array .. may need new name...
       // TODO: The number of quotations is equal to the number of % ...
       // Count the %'s (i.e. the number of quotations)

       this._quoteSeparators = [];
       //this._numberOfQuotes = 0;
       let index = 0;
       let allQuotes = this._quoteFileString;

       while (index < allQuotes.length) {
	  index = allQuotes.indexOf("%", index);
	  if (index === -1)
	     break;  // no more %'s
	  this._quoteSeparators.push(index);
	  index++;
       }
       //TODO: Ending % shouldn't count, if there is one -- see lastIndexOf
    }
}

function main(metadata, desklet_id){
    let desklet = new MyDesklet(metadata, desklet_id);
    return desklet;
}
