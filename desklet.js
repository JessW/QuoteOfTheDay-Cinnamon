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
                                     this.on_setting_changed,
                                     null);
	} catch (e) {
	    global.logError("logging from _init");
            global.logError(e);
        } 


        this._quoteContainer = new St.BoxLayout({vertical:true, style_class: 'quote-container'});
        this._dateContainer =  new St.BoxLayout({vertical:false, style_class: 'date-container'});

        this._date = new St.Label();

        this._dateContainer.add(this._date);
        this._quoteContainer.add(this._dateContainer);
        this.setContent(this._quoteContainer);
        this.setHeader(_("Quote"));
	// changing clock to quote below crashes cinnamon, oops
        this._dateSettings = new Gio.Settings({schema: 'org.cinnamon.desklets.clock'});
        this._updateQuote();
    },

    on_desklet_removed: function() {
	Mainloop.source_remove(this.timeout);
    },
   
    // I need this function to exist for the setting binding, but I dunno what to put here yet! 
    on_setting_changed: function() {
       let dateFormat = '%A,%e %B';
    },

    _updateQuote: function(){
       try {
       let dateFormat = '%A,%e %B';
       let displayDate = new Date();
       // fileContents istanceof String is false
       let fileContents = Cinnamon.get_file_contents_utf8_sync("/home/jessica/Quotes/literature");
       let myString = fileContents.toString();
       let firstIndex = myString.indexOf("%");
       let secondIndex = myString.indexOf("%", firstIndex + 1); // do i need +1?
       let substring = myString.substring(firstIndex + 1, secondIndex);
       this._date.set_text(substring); // this works

       //this._date.set_text(fileContents);  // this works
       //this._date.set_text(myString); // this works

       //this._date.set_text(displayDate.toLocaleFormat(dateFormat));
       //let index = fileContents.indexOf("a");
       //this._date.set_text(index);
       
       this.timeout = Mainloop.timeout_add_seconds(100, Lang.bind(this, this._updateQuote));
       }catch(e){
	  global.logError("logging from _updateQuote");
	  global.logError(e);
       }
    }
}

function main(metadata, desklet_id){
    let desklet = new MyDesklet(metadata, desklet_id);
    return desklet;
}
