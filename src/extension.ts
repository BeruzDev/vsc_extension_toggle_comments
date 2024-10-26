import * as vscode from 'vscode';

//Control de visibilidad de los comentarios
let commentsHidden = false;
//Array de comentarios y sus respectivas posiciones
let commentsArray: {text: string, position: vscode.Position }[] = [];

export function activate(context: vscode.ExtensionContext) {
	//Creación del comando para mostrar o ocultar comentarios
	const hideCommentsCommand = vscode.commands.registerCommand('extension.toggleComments', () => {
		//Editor de vsc -> si no hay ningún editor abierto (no hay archivos abiertos), no hay nada que hacer.
		const editor = vscode.window.activeTextEditor;
		//Si el editor no está vacío termina el programa.
		if (!editor) {
			return;
		};

		//Obtener el documento actual del editor
		const document = editor.document;
		//Obtener el texto actual del documento
		const text = document.getText();

		//Expresiones regulares para identificar comentarios "//" y "/* */"
		const singleLineComments = /\/\/.*$/gm;//<-Todo lo que haya en la linea después de "//"
		const blockComments = /\/\*[\s\S]*?\*\//gm;//<-Todo lo que haya entre  "/*" y "*/"

		//Alterar la visibilidad
		if(!commentsHidden){//<-si los comentarios son visibles
			//Almacenarlos en el array
			commentsArray = [];
			let match;

			//Buscar comentarios de una linea "//" y añadirlos al array
			while((match = singleLineComments.exec(text)) !== null){
				const lineNumber = document.positionAt(match.index).line;//<-Linea donde se encuentra el comentario
				console.log("Línea encontrada:", lineNumber);
				commentsArray.push({ text: match[0], position: new vscode.Position(lineNumber, 0) });//<- Agregar el comentario y la posición al array
			}

			//Buscar comentarios de bloque "/* */" y añadirlos al array
			while((match = blockComments.exec(text)) !== null){
				const startLine = document.positionAt(match.index).line;//<- Linea de inicio del bloque de comentario
				const endLine = startLine + match[0].split('\n').length - 1;//<- Linea del final del bloque de comentario
				console.log("Línea de inicio encontrada:", startLine + 1, "Línea de fin:", endLine + 1);
				commentsArray.push({ text: match[0],  position: new vscode.Position(startLine, 0) });//<- Agregar el comentario y la posición al array
			}

			console.log("Comentarios ocultados:", commentsArray.map(comment => ({
				text: comment.text,
				line: comment.position.line 
			})));

			//Eliminar los comentarios del texto para "ocultarlos"
			const newText = text.replace(singleLineComments, '').replace(blockComments, '');

			//Editar el documento para quitar los comentarios
			editor.edit(editBuilder => {
				//Recoger todo el texto des de el principio(position 0) hasta el final(text.length)
				const fullRange = new vscode.Range(
					document.positionAt(0),
					document.positionAt(text.length)
				);
				//Remplazar todo el texto(fullRange) con el newText
				editBuilder.replace(fullRange, newText);
			});
		} else {
            let newText = document.getText(); //<- Recoger el texto actual

			//Si los comentarios están ocultos, restaurarlos des del array
			commentsArray.forEach(comment => {
				const lineNumber = comment.position.line;//<- Obtener la linea donde insertar el comentario
				const currentLine = newText.split('\n')[lineNumber];//<- Hacer un salto de linea para dejar espacio

				//Verificar si hay texto en la currentLine
				if(currentLine.trim() === ''){

					console.log(`Reinsertando comentario en la línea ${lineNumber + 1}:`, comment.text);

					//Si en la linea actual no hay texto insertar el comentario
					newText = newText.substring(0, comment.position.character) + comment.text + '\n' +newText.substring(comment.position.character);
				}
			});

			//Editar el documento para poner el nuevo texto con los comentarios reintegrados
			editor.edit(editBuilder => {
				const fullRange = new vscode.Range(
					document.positionAt(0),
					document.positionAt(newText.length)
				);
				editBuilder.replace(fullRange, newText);
			});

			console.log("Comentarios reinsertados:", commentsArray);
		}

		//Alternar el estado de commentsHidden entre false y true según su valor actual
		commentsHidden = !commentsHidden;
	});

	context.subscriptions.push(hideCommentsCommand);
	console.log('Congratulations, your extension "toggle-comments-visibility" is now active!');

}

export function deactivate() {}
