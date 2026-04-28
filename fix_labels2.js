const fs = require('fs');

function fixAllLabels(file) {
    let content = fs.readFileSync(file, 'utf8');
    let idx = 0;
    
    // Find all labels that don't have a 'for' attribute
    content = content.replace(/<label((?:(?!for=)[^>])*)>([\s\S]*?)<\/label>\s*(?:<div[^>]*>\s*)*(<(input|textarea|p-select|p-inputnumber|p-multiselect|p-calendar)([^>]*?)>)/g, (match, labelAttrs, labelText, tagFull, tagName, tagAttrs) => {
        idx++;
        let id = 'auto-id-' + Math.random().toString(36).substr(2, 9) + '-' + idx;
        
        let newLabelAttrs = ' for="' + id + '"' + labelAttrs;
        
        let newTagAttrs = tagAttrs;
        let hasId = tagAttrs.includes('id=') || tagAttrs.includes('inputId=');
        
        if (!hasId) {
            if (tagName === 'p-select' || tagName === 'p-inputnumber' || tagName === 'p-multiselect' || tagName === 'p-calendar') {
                newTagAttrs = ' inputId="' + id + '"' + tagAttrs;
            } else {
                newTagAttrs = ' id="' + id + '"' + tagAttrs;
            }
        } else {
            // Extract existing ID to use in label
            let m = tagAttrs.match(/(?:inputId|id)="([^"]+)"/);
            if (m) {
                newLabelAttrs = ' for="' + m[1] + '"' + labelAttrs;
            }
        }
        
        // Return replaced
        let newTagFull = '<' + tagName + newTagAttrs + '>';
        return '<label' + newLabelAttrs + '>' + labelText + '</label>' + match.substring(match.indexOf('</label>') + 8).replace(tagFull, newTagFull);
    });
    fs.writeFileSync(file, content);
}
fixAllLabels('src/app/pages/tutor/academic-page/tutor-academic-page.component.html');
fixAllLabels('src/app/pages/tutor/admin-page/tutor-admin-page.component.html');
