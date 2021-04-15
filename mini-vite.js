const Koa2 = require('koa2');
const fs = require('fs');
const path = require('path');
const compilerSfc = require('@vue/compiler-sfc');
const compilerDom = require('@vue/compiler-dom');
const app = new Koa2();

const rewriteImport = (content) => {
    // s1为匹配的部分，s2为分组的部分
    return content.replace(/ from ['"](.*)['"]/g, function(s1, s2) {
        if(s2.startsWith('./')|| s2.startsWith('../') || s2.startsWith('/')) {
            return s1;
        }
        return ` from '/@modules/${s2}'`;
    })
}
app.use(async (ctx) => {
    const { url, query } = ctx.request;
    if(url === '/') {
        ctx.type = "text/html";
        ctx.body =  fs.readFileSync(path.join(__dirname, './index.html'), 'utf-8')
    } else if(url.endsWith('.js')){
        ctx.type = "application/javascript";
        ctx.body =  rewriteImport(fs.readFileSync(path.join(__dirname, url), 'utf-8'))
    } else if(url.startsWith('/@modules/')) {
        const moduleName = url.replace('/@modules/', '');
        const prefix = path.join(__dirname, './node_modules', moduleName);
        const module= require(prefix + '/package.json').module;
        const filePath = path.join(prefix, module);
        ctx.type = "application/javascript";
        ctx.body =  rewriteImport(fs.readFileSync(filePath, 'utf-8'))
    } else if(url.indexOf('.vue') > -1) {
        console.log(url);
        const p = path.join(__dirname, url.split('?')[0]);
        // 解析成AST
        const ret = compilerSfc.parse(fs.readFileSync(p, 'utf-8'));
        console.log(ret)
        // console.log(ret)
        if(!query.type) {
            // 获取script里的内容
            const scriptContent = ret.descriptor.script ? 
                    ret.descriptor.script.content :
                    ret.descriptor.scriptSetup.content;
            console.log('scriptContent', scriptContent)
            // 替换默认导出为一个常量
            const script = scriptContent.replace('export default ', 'const _sfc_main = ')
  
            ctx.type = "application/javascript";
            ctx.body =  `
                ${rewriteImport(script)}
                // 解析template
                import { render as __render } from '${url}?type=template'
                _sfc_main.render = __render
                export default _sfc_main
            `
        } else if(query.type === 'template') {
            const tpl = ret.descriptor.template.content;
            // 编译
            const render = compilerDom.compile(tpl, {
                mode: 'module'
            }).code;
            ctx.type = "application/javascript";
            ctx.body = rewriteImport(render);
        }
    }

})
app.listen(3000,()=> {
    console.log("http://127.0.0.1:3000")
})