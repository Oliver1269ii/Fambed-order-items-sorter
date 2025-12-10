function get_size(item){
    if(item.name.match(/\d{1,3} x \d{1,3} cm/)){
        name = item.name.split(" ");
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
                    dimensions = {
                        "width": index[0],
                        "length": index[1],
                        "height": index[2]
                    };
                    return dimensions;
                }
                
                index = index.split("x");
                dimensions = {
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
            dimensions = {
                "width": index[0],
                "length": index[1],
                "height": height
            };
            
            return dimensions;
        }
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
    "lysegraa": "Light Grey"
}

var expectedShippingDate = get_expected_shipping_date();

for (const item of $input.first().json.line_items) {

    item.specs = {};
    item.specs.comment = $input.first().json.customer_note;
    item.errors = "none";
    itemNameArray = item.name.split(" ");
    
    if(item.sku.match(/fambed_tm/)){
        item.specs.type = "Mattress topper";

        if(!item.sku.match(/fambed_tm_special/)){

            item.specs.dimensions = get_size(item);

        } else{
            item.errors = "Contact";
            item.specs.dimensions = {
                "width": 0,
                "length": 0,
                "height": 0
            };
        }


    }else if(item.sku.match(/fambed_sheet/)){
        item.specs.type = "-";
        item.specs.product = "Sheet with elastic band";
        item.specs.expectedShipment = get_expected_shipping_date();
        item.specs.color = colorCorrection[get_color(item)];

        if(!item.sku.match(/fambed_sheet_special/)){

            var dimensions = get_size(item);
            item.specs.dimensions = {
                "labelWidth": dimensions["width"],
                "labelLenght": dimensions["length"],
                "labelHeight": "30",
                "prodWidth": Math.round(dimensions["width"] * 1.03),
                "prodLength": Math.round(dimensions["length"] * 1.01),
                "prodHeight": Math.round(30 * 1.03)
            };

        } else{
            item.specs.dimensions = {
                "labelWidth": 0,
                "labelLenght": 0,
                "labelHeight": 0,
                "prodWidth": 0,
                "prodLength": 0,
                "prodHeight": 0
            };
            item.errors = "Contact";
        }

    }else if(item.sku.match(/(fambed_sk)|(fambed_system_sk)/)){
        item.specs.product = "Bedskirt";
        item.specs.color = colorCorrection[get_color(item)];
        item.specs.expectedShipment = expectedShippingDate;

        if(!item.sku.match(/fambed_sk_special/)){

            var dimensions = get_size(item);
            item.specs.dimensions = {
                "labelWidth": dimensions["width"],
                "labelLenght": dimensions["length"],
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
                    }else{
                        item.specs.type = "with inverted pleats";
                    }
                }
            }
            
        
        } else{
            item.error = "Contact";
        }
        
    }else if(item.sku.match(/fambed_familieseng/)){
        item.specs.type = "Bed";
        if(!item.sku.match(/fambed_special/)){

            item.specs.dimensions = get_size(item);

            for(nestedItem of $input.first().json.line_items){
                for(compNumber of item.composite_children){
                    if(nestedItem.id == compNumber){
                        if(nestedItem.sku.match(/fambed_cover/)){
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
        item.specs.type = "skip";
    }

}

return $input.all();