function get_size(item){
    if(item.name.match(/\d{1,3} x \d{1,3} cm/)){
        var name = item.name.split(" ");
        var loopIndex = -1
        for(array_item of name){
            loopIndex += 1
            if(array_item.match(/\d{3}/)){
                array_item = name[loopIndex] + name[loopIndex+1] + name[loopIndex+2]
                if(array_item.match(/(\d{3})x(\d{3})/)){
                    name[loopIndex] = array_item;
                    name.splice(loopIndex+1, 1);
                    name.splice(loopIndex+1, 1);
                }
            }
        }
    }else{
        var name = item.name.split(" ");
    }
    for(index of name){
        if(index.match(/(\d{3})x(\d{3})/)){
            
            if(index.match(/(\d{3})x(\d{3})x(\d{1})/)){
                
                if(index.match(/(\d{3})x(\d{3})x(\d{1})cm/)){
                    index = index.replace("cm", "").split("x");
                    var dimensions = {
                        "width": index[0],
                        "length": index[1],
                        "height": index[2]
                    };
                    return dimensions;
                }
                
                index = index.split("x");
                var dimensions = {
                    "width": index[0],
                    "length": index[1],
                    "height": index[2]
                };
                return dimensions;
            }
            var height = 0;

            for(data of item.meta_data){
                if(data.key == "pa_hoejde"){
                    height = data.value.replace("cm", "");
                }
            }

            index = index.split("x");
            var dimensions = {
                "width": index[0],
                "length": index[1],
                "height": height
            };
            
            return dimensions;
        }
    }
    if (item.sku.match(/fambed_sk_(\d{3})x(\d{3})/)){
        for (let data of item.meta_data){
            if (data.key == "pa_laengde"){
                var itemLength = data.value;
            }
            else if (data.key == "pa_bredde"){
                var itemWidth = data.value;
            }
            else if (data.key == "pa_hoejde"){
                var itemHeight = data.value.replace("cm", ""); 
            }
        }
        return {"width": itemWidth, "length": itemLength, "height": itemHeight};
    }
}

function get_color(item){
    var color = "none";
    for(data of item.meta_data){
        if(data.key == "pa_farve"){
            color = data.value;
            break;
        }
    }
    if(color == "none"){
        for(data of item.meta_data){
            if(data.key == "pa_sengegavl-farve"){
                color = data.value;
                break;
            }
        }
    }
    return color;
}

function get_expected_shipping_date(){

    var date = $input.first().json.date_created.split("T")[0];
    var dateYear = date.split("-")[0];
    var dateMonth = date.split("-")[1];
    var dateDay = date.split("-")[2];

    if(Number(dateDay) <= 15){
        var expected = "30" + "/" + dateMonth + "/" + dateYear;
      } else{
        if(Number(dateMonth) + 1 < 13){
          dateMonth = Number(dateMonth) + 1;
          var expected = "15" + "/" + dateMonth + "/" + dateYear;
        }else{
          dateYear = Number(dateYear) + 1;
          var expected = "15" + "/" + "01" + "/" + dateYear;
        }
      }
    return expected;
}

var colorCorrection = {
    "none": "No color",
    "hvid": "White",
    "beige": "Beige",
    "graa": "Grey",
    "morkegra": "Dark Grey",
    "morkegraa": "Dark Grey",
    "lysegraa": "Light Grey",
    "lysegra": "Light Grey",
    "grå": "Grey"
    
}

var countries = {
    "dk": "Danmark",
    "nl": "Holland",
    "de": "Tyskland",
    "uk": "United Kingdom",
    "se": "Sverige",
    "no": "Norge",
    "fr": "Frankrig"
}

$input.first().json.siteCountry = countries[$('Webhook').first().json.body.site_url.split(".").at(-1)];

var expectedShippingDate = get_expected_shipping_date();

for (const item of $input.first().json.line_items) {

    item.specs = {};
    item.errors = "none";
    itemNameArray = item.name.split(" ");
    
    if(item.name.includes("×")){
        item.name = item.name.replace("×", "x");
    }
    if(typeof item.sku == "object"){
        item.errors = "no_sku";
    }else{
    if(item.sku.match(/fambed_tm/)){
        item.specs.type = "Mattress topper";

        if(!item.sku.match(/fambed_tm_special/)){

            item.specs.dimensions = get_size(item);

        } else{

            for(metaData of $input.first().json.meta_data){
                if(metaData.key == "_jf_wc_details"){
                    if(metaData.value.settings.product_manual[0].id == item.product_id){
                        var formData = metaData.value.form_data;

                        var dimensions = {
                            "width": formData.bredde_paa_seng,
                            "length": formData.laengde_paa_seng,
                            "height": 0
                        };
                        item.specs.dimensions = {
                            "labelWidth": dimensions["width"],
                            "labelLength": dimensions["length"],
                            "labelHeight": dimensions["height"],
                            "prodWidth": Math.round(dimensions["width"] * 1.03),
                            "prodLength": Math.round(dimensions["length"] * 1.01),
                            "prodHeight": Math.round(dimensions["height"] * 1.03)
                        };

                    }
                }
            }

        }


    }else if(item.sku.match(/fambed_sheet/)){
        item.specs.type = "-";
        item.specs.product = "Sheet with elastic band";
        item.specs.expectedShipment = expectedShippingDate;
        
        if(!item.sku.match(/fambed_sheet_special/)){
            var dimensions = get_size(item);
            
            item.specs.color = colorCorrection[get_color(item)];
            item.specs.dimensions = {
                "labelWidth": dimensions["width"],
                "labelLength": dimensions["length"],
                "labelHeight": "30",
                "prodWidth": Math.round(dimensions["width"] * 1.03),
                "prodLength": Math.round(dimensions["length"] * 1.01),
                "prodHeight": Math.round(30 * 1.03)
            };

        } else{
            for(metaData of $input.first().json.meta_data){
                if(metaData.key == "_jf_wc_details"){
                    if(metaData.value.settings.product_manual[0].id == item.product_id){
                        var formData = metaData.value.form_data;

                        item.specs.color = colorCorrection[formData.farve.toLowerCase()];

                        var dimensions = {
                            "width": formData.bredde_paa_lagen,
                            "length": formData.laengde_paa_lagen,
                            "height": formData.hoejde_paa_lagen_copy
                        };
                        item.specs.dimensions = {
                            "labelWidth": dimensions["width"],
                            "labelLength": dimensions["length"],
                            "labelHeight": dimensions["height"],
                            "prodWidth": Math.round(dimensions["width"] * 1.03),
                            "prodLength": Math.round(dimensions["length"] * 1.01),
                            "prodHeight": Math.round(dimensions["height"] * 1.03)
                        };

                    }
                }
            }
        }

    }else if(item.sku.match(/fambed_((system_)?)sk_(\d{3})/)){
        item.specs.product = "Bedskirt";
        item.specs.color = colorCorrection[get_color(item)];
        item.specs.expectedShipment = expectedShippingDate;

        if(!item.sku.match(/fambed_sk_special/)){

            var dimensions = get_size(item);
            item.specs.dimensions = {
                "labelWidth": dimensions["width"],
                "labelLength": dimensions["length"],
                "labelHeight": dimensions["height"],
                "prodWidth": Math.round(dimensions["width"] * 1.01),
                "prodLength": Math.round(dimensions["length"] * 1.01),
                "prodHeight": Math.round(dimensions["height"] * 1.03)
            };
            
            // get style/type for bedskirt
            for(data of item.meta_data){
                if(data.key == "pa_sengekappe-stil"){
                    if(data.value == "boelget"){
                        item.specs.type = "Ruffled";
                        break;
                    }else{
                        item.specs.type = "with inverted pleats";
                        break;
                    }
                }
            }
            
        
        } else{
            for(metaData of $input.first().json.meta_data){
                if(metaData.key == "_jf_wc_details"){
                    if(metaData.value.settings.product_manual[0].id == item.product_id){
                        var formData = metaData.value.form_data;

                        item.specs.color = colorCorrection[formData.farve.toLowerCase()];
                        
                        if(formData.stil.toLowerCase() == "boelget"){
                            item.specs.type = "Ruffled";
                        }else{
                            item.specs.type = "with inverted pleats";
                        }

                        var dimensions = {
                            "width": formData.bredde_paa_sk,
                            "length": formData.laengde_paa_sk,
                            "height": formData.hoejde_paa_sk
                        };
                        item.specs.dimensions = {
                            "labelWidth": dimensions["width"],
                            "labelLength": dimensions["length"],
                            "labelHeight": dimensions["height"],
                            "prodWidth": Math.round(dimensions["width"] * 1.01),
                            "prodLength": Math.round(dimensions["length"] * 1.01),
                            "prodHeight": Math.round(dimensions["height"] * 1.03)
                        };

                    }
                }
            }
        }
        
    }else if(item.sku.match(/fambed_((familieseng_)?)(\d{3})x(\d{3})/)){
        item.specs.type = "Bed";
        if(!item.sku.match(/fambed_special/)){

            item.specs.dimensions = get_size(item);

            for(nestedItem of $input.first().json.line_items){
                for(compNumber of item.composite_children){
                    if(nestedItem.id == compNumber){
                        if(nestedItem.sku.match(/fambed_cover/) || nestedItem.sku.match(/fambed_((light|dark)_grey)|(beige)/)){
                            item.specs.color = colorCorrection[nestedItem.sku.split("_")[2]]
                            break;
                        }
                    }
                }
            }
        }

    }else if(item.sku.match(/fambed_sengegavl/)){
        item.specs.type = "Headboard";

        for(data of item.meta_data){
            if(data.key == "pa_bredde"){
                var width = data.value.replace("-", " ");
                break;
            }
        }
        item.specs.color = colorCorrection[get_color(item)];
        item.specs.dimensions = {
            "width": width,
            "length": "",
            "height": ""
        };
    }else{
        item.errors = "skip";
    }

}
}
return $input.all();