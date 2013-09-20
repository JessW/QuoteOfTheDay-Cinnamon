const Cinnamon = imports.gi.Cinnamon;
const Desklet = imports.ui.desklet;
const Gio = imports.gi.Gio;
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
                                     "directory",
                                     "dir",
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
	// changing clock to quote below crashes cinnamon, oops
	// but do I even need this line?
        //this._quoteSettings = new Gio.Settings({schema: 'org.cinnamon.desklets.clock'});
	this.on_quote_file_changed();
        this._updateQuote();
    },

    on_desklet_removed: function() {
	Mainloop.source_remove(this.timeout);
    },
   
    // I need this function to exist for the setting binding, but I dunno what to put here yet! 
    on_quote_file_changed: function() {
       let quoteFileContents = Cinnamon.get_file_contents_utf8_sync("/home/jessica/Quotes/literature");
       this._quoteFileString = quoteFileContents.toString();

       // Count the %'s (i.e. the number of quotations)
       let quotes = this._quoteFileString;
       this._numberOfQuotes = 0;
       let index = 0;

       while(index !== -1) {
	  index = quotes.indexOf("%", index);
	  if (index === -1)
	     break;  // no more %'s
	  this._numberOfQuotes++;
	  index++;
       }
    },

    _updateQuote: function(){
       try {
       let dateFormat = '%A,%e %B';
       let displayDate = new Date();
       // fileContents istanceof String is false
       //let fileContents = Cinnamon.get_file_contents_utf8_sync("/home/jessica/Quotes/literature");
       //let this._quoteFileString = fileContents.toString();
       
       let firstIndex = this._quoteFileString.indexOf("%");
       let secondIndex = this._quoteFileString.indexOf("%", firstIndex + 1); // do i need +1?
       let substring = this._quoteFileString.substring(firstIndex + 1, secondIndex);
       this._quote.set_text(substring); // this works

       //this._quote.set_text(fileContents);  // this works
       //this._quote.set_text(this._quoteFileString); // this works

       //this._quote.set_text(displayDate.toLocaleFormat(dateFormat));
       //let index = fileContents.indexOf("a");
       //this._quote.set_text(index);
       
       this.timeout = Mainloop.timeout_add_seconds(100, Lang.bind(this, this._updateQuote));
       }catch(e){
	  global.logError(e);
       }
    }
}

function main(metadata, desklet_id){
    let desklet = new MyDesklet(metadata, desklet_id);
    return desklet;
}
