const fs = require('fs');

function fixLabels(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let labelIndex = 0;
    
    // Replace <label>...<input/textarea/p-select/p-inputnumber formControlName="...">
    content = content.replace(/<label([\s\S]*?)>([\s\S]*?)<\/label>\s*<(input|textarea|p-select|p-inputnumber)([^>]*?)formControlName="([^"]+)"([^>]*?)>/g, (match, labelAttrs, labelText, tag, attr1, fcn, attr2) => {
        labelIndex++;
        const id = 'ctrl-' + fcn + '-' + labelIndex;
        
        let newLabelAttrs = labelAttrs;
        if (!newLabelAttrs.includes('for=')) {
            newLabelAttrs = ' for="' + id + '"' + newLabelAttrs;
        }
        
        let newAttr1 = attr1;
        let newAttr2 = attr2;
        let hasId = (attr1 + attr2).includes('id=') || (attr1 + attr2).includes('inputId=');
        
        if (!hasId) {
            if (tag === 'p-select' || tag === 'p-inputnumber') {
                newAttr1 = ' inputId="' + id + '"' + attr1;
            } else {
                newAttr1 = ' id="' + id + '"' + attr1;
            }
        }
        
        return `<label${newLabelAttrs}>${labelText}</label>\n          <${tag}${newAttr1}formControlName="${fcn}"${newAttr2}>`;
    });
    
    // Save file
    fs.writeFileSync(filePath, content);
}

fixLabels('src/app/pages/tutor/academic-page/tutor-academic-page.component.html');
fixLabels('src/app/pages/tutor/admin-page/tutor-admin-page.component.html');
