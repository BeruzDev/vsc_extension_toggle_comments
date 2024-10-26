import * as vscode from 'vscode';

//Control de visibilidad de los comentarios
let commentsHidden = false;

export function activate(context: vscode.ExtensionContext) {

	//Creación del comando para mostrar o ocultar comentarios
	const hideCommentsCommand = vscode.commands.registerCommand('extension.toggleComments', () => {
		//Editor de vsc -> si no hay ningún editor abierto (no hay archivos abiertos), no hay nada que hacer.
		const editor = vscode.window.activeTextEditor;
		//Si el editor no está vacío termina el programa.
		if (!editor) return;

		//Obtener el documento actual del editor
		const document = editor.document;
		//Obtener el texto actual del documento
		const text = document.getText();

		//Expresiones regulares para identificar comentarios "//" y "/* */"
		const singleLineComments = /\/\/.*$/gm;//<-Todo lo que haya en la linea después de "//"
		const blockComments = /\/\*[\s\S]*?\*\//gm;//<-Todo lo que haya entre  "/*" y "*/"

		//Alterar la visibilidad
		//Si commentsHidden es false (comentarios visibles) -> eliminar todos los caracteres "\x00", ("\x00" <- carácter invisible)
		//Sino (comentarios ocultos) -> reemplazar todos los comentarios por "\x00"
		const newText = commentsHidden 
			? text.replace(/(<!--.*?-->)|(\x00+)/g, "")//<-Eliminar caracteres invisibles 
			: text.replace(singleLineComments, '\x00').replace(blockComments, '\x00'); //<-Ocultar con caracteres invisibles

		//Editamos el documento con newText
		editor.edit(editBuilder => {
			//Recoger todo el texto des de el principio(position 0) hasta el final(text.length)
			const fullRange = new vscode.Range(
				document.positionAt(0),
				document.positionAt(text.length)
			);
			//Remplazar todo el texto(fullRange) con el newText
			editBuilder.replace(fullRange, newText);
		});

		//Alternar el estado de commentsHidden entre false y true según su valor actual
		commentsHidden = !commentsHidden;
	});

	context.subscriptions.push(hideCommentsCommand);

	console.log('Congratulations, your extension "toggle-comments-visibility" is now active!');

}

export function deactivate() {}