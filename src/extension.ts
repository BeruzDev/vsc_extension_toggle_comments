import * as vscode from 'vscode';

//Control de visibilidad de los comentarios
let commentsHidden = false;
//Array de comentarios 
let commentsArray: string[] = [];

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
				commentsArray.push(match[0]);//<- Agregar el comentario al array
			}

			//Buscar comentarios de bloque "/* */" y añadirlos al array
			while((match = blockComments.exec(text)) !== null){
				commentsArray.push(match[0]);//<- Agregar el comentario al array
			}

			//Eliminar los comentarios del texto para "ocultarlos"
			const newText = text.replace(singleLineComments, '').replace(blockComments, '');

			//Editar el documento con newText
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
			//Si los comentarios están ocultos, restaurarlos des del array
			const restoredText = commentsArray.join('\n');//<-Reunir todos los comentarios en un solo texto

			//Editar el documento para agregar los comentarios de nuevo
			editor.edit(editBuilder => {
				const fullRange = new vscode.Range(
					document.positionAt(0),
					document.positionAt(0)//<-Insertar al principio -> MEJORAR ESTO!!! TIENEN QUE APARECER EN LA LINEA CORRESPONDIENTE
				);
				editBuilder.insert(fullRange.start, restoredText + '\n');//<-Agregar los comentarios de nuevo
			});
		}

		//Alternar el estado de commentsHidden entre false y true según su valor actual
		commentsHidden = !commentsHidden;
	});

	context.subscriptions.push(hideCommentsCommand);
	console.log('Congratulations, your extension "toggle-comments-visibility" is now active!');

}

export function deactivate() {}
