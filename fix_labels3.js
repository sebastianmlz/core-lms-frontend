const fs = require('fs');

function fixHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove eslint-disable
    content = content.replace(/<!-- eslint-disable.*?-->\r?\n?/g, '');

    let i = 0;
    // Replace <label>...</label> \s* <input/textarea/p-select/p-inputnumber/p-multiselect/p-calendar... formControlName="X">
    content = content.replace(/<label([^>]*)>([\s\S]*?)<\/label>\s*<(input|textarea|p-select|p-inputnumber|p-multiselect|p-calendar)([^>]*)formControlName="([^"]+)"([^>]*)>/g, (match, labelAttrs, labelText, tag, attr1, fcn, attr2) => {
        i++;
        const id = 'field-' + fcn + '-' + i;
        
        let newLabelAttrs = labelAttrs;
        if (!newLabelAttrs.includes('for=')) {
            newLabelAttrs = ' for="' + id + '"' + labelAttrs;
        }
        
        let newAttr1 = attr1;
        let newAttr2 = attr2;
        let hasId = (attr1 + attr2).includes('id=') || (attr1 + attr2).includes('inputId=');
        
        if (!hasId) {
            if (tag.startsWith('p-')) {
                newAttr1 = ' inputId="' + id + '"' + attr1;
            } else {
                newAttr1 = ' id="' + id + '"' + attr1;
            }
        } else {
            let m = (attr1 + attr2).match(/(?:id|inputId)="([^"]+)"/);
            if (m && !newLabelAttrs.includes('for=')) {
                newLabelAttrs = ' for="' + m[1] + '"' + labelAttrs;
            }
        }
        
        return `<label${newLabelAttrs}>${labelText}</label>\n          <${tag}${newAttr1}formControlName="${fcn}"${newAttr2}>`;
    });
    
    // Additionally, in tutor-admin-page there's an input type="file" without formControlName
    // <label ...>Archivo</label> \s* <input id="file" type="file" ...>
    content = content.replace(/<label([^>]*)>([\s\S]*?)<\/label>\s*<(input)([^>]*)type="file"([^>]*)>/g, (match, labelAttrs, labelText, tag, attr1, attr2) => {
        i++;
        const id = 'field-file-' + i;
        
        let newLabelAttrs = labelAttrs;
        if (!newLabelAttrs.includes('for=')) {
            newLabelAttrs = ' for="' + id + '"' + labelAttrs;
        }
        
        let newAttr1 = attr1;
        let hasId = (attr1 + attr2).includes('id=');
        
        if (!hasId) {
            newAttr1 = ' id="' + id + '"' + attr1;
        } else {
            let m = (attr1 + attr2).match(/id="([^"]+)"/);
            if (m && !newLabelAttrs.includes('for=')) {
                newLabelAttrs = ' for="' + m[1] + '"' + labelAttrs;
            }
        }
        
        return `<label${newLabelAttrs}>${labelText}</label>\n          <${tag}${newAttr1}type="file"${attr2}>`;
    });
    
    fs.writeFileSync(filePath, content);
}

fixHtmlFile('src/app/pages/tutor/academic-page/tutor-academic-page.component.html');
fixHtmlFile('src/app/pages/tutor/admin-page/tutor-admin-page.component.html');
