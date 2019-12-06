// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// 跳转到定义
const path=require('path');
const fs=require('fs');
function provideDefinition(document:any,position:any,token:any){
    const fileName=document.fileName;//记录了完整路径名
    const workDir=path.dirname(fileName);
	const word=document.getText(document.getWordRangeAtPosition(position));
	const line=document.lineAt(position);
    console.log('====== 进入 provideDefinition 方法 ======');
    console.log('fileName: ' + fileName); // 当前文件完整路径
    console.log('workDir: ' + workDir); // 当前文件所在目录
    console.log('word: ' + word); // 当前光标所在单词
    console.log('line: ' + line.text); // 当前光标所在行
    console.log('projectPath: ' +fileName); // 当前工程目录
    // 只处理package.json文件
    if (/\/package\.json$/.test(fileName)) {
        console.log(word, line.text);
        const json = document.getText();
        if (new RegExp(`"(dependencies|devDependencies)":\\s*?\\{[\\s\\S]*?${word.replace(/\//g, '\\/')}[\\s\\S]*?\\}`, 'gm').test(json)) {
            let destPath = `${workDir}/node_modules/${word.replace(/"/g, '')}/package.json`;
            if (fs.existsSync(destPath)) {
                // new vscode.Position(0, 0) 表示跳转到某个文件的第一行第一列
                return new vscode.Location(vscode.Uri.file(destPath), new vscode.Position(0, 0));
            }
        }
    }
}
function provideCompletionItems(document:any, position:any, token:any, context:any) {
	const line        = document.lineAt(position);
    const projectPath =document.fileName;

    // 只截取到光标位置为止，防止一些特殊情况
    const lineText = line.text.substring(0, position.character);
    // 简单匹配，只要当前光标前的字符串为`this.dependencies.`都自动带出所有的依赖
    if(/(^|=| )\w+\.dependencies\.$/g.test(lineText)) {
        const json = require(`${projectPath}/package.json`);
        const dependencies = Object.keys(json.dependencies || {}).concat(Object.keys(json.devDependencies || {}));
        return dependencies.map(dep => {
            // vscode.CompletionItemKind 表示提示的类型
            return new vscode.CompletionItem(dep, vscode.CompletionItemKind.Field);
        });
    }
}
function resolveCompletionItem(item:any, token:any) {
    return null;
}

function provideHover(document:any, position:any, token:any) {
    const fileName    = document.fileName;
    const workDir     = path.dirname(fileName);
    const word        = document.getText(document.getWordRangeAtPosition(position));

    if (/\/package\.json$/.test(fileName)) {
        console.log('进入provideHover方法');
        const json = document.getText();
        if (new RegExp(`"(dependencies|devDependencies)":\\s*?\\{[\\s\\S]*?${word.replace(/\//g, '\\/')}[\\s\\S]*?\\}`, 'gm').test(json)) {
            let destPath = `${workDir}/node_modules/${word.replace(/"/g, '')}/package.json`;
            if (fs.existsSync(destPath)) {
                const content = require(destPath);
                console.log('hover已生效');
                // hover内容支持markdown语法
                return new vscode.Hover(`* **名称**：${content.name}\n* **版本**：${content.version}\n* **许可协议**：${content.license}`);
            }
        }
    }
}

// 注册激活事件
export function activate(context: vscode.ExtensionContext) {

	let disposable1 = vscode.commands.registerCommand('extension.helloWorld', () => {
		vscode.window.showInformationMessage('Hello VS code!');
	});
	let disposable2 = vscode.commands.registerCommand('extension.showerror', () => {
		vscode.window.showErrorMessage("you have a error");
	});
	let disposable3 =vscode.commands.registerCommand('extension.getCurrentFilePath',(uri)=>{
		vscode.window.showInformationMessage(`当前文件夹路径是：${uri? uri.path:'空'}`);
	});

	context.subscriptions.push(disposable1);
	context.subscriptions.push(disposable2);
	context.subscriptions.push(disposable3);

	context.subscriptions.push(vscode.languages.registerDefinitionProvider(['json','file'], {
        provideDefinition
	}));
	
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider({scheme: 'file', language: 'javascript'}, {
        provideCompletionItems,
        resolveCompletionItem
    }, '.'));
    context.subscriptions.push(vscode.languages.registerHoverProvider('json', {
        provideHover
    }));
}

// this method is called when your extension is deactivated
export function deactivate() {}
