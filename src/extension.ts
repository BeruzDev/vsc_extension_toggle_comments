import * as vscode from 'vscode';

//Control de visibilidad de los comentarios
let commentsHidden = false;
//Array de comentarios y sus respectivas posiciones
let commentsArray: {text: string, position: vscode.Position, isEndOfLine: boolean }[] = [];

//Guardar los comentarios para su persistencia aunque se cierre vsc
//Guardar el array de comentarios en el almacenamiento global de vsc
function saveCommentToStorage(context: vscode.ExtensionContext) {
	console.log("Guardando en storage: ", commentsArray);
	context.globalState.update('commentsArray', commentsArray);
	context.globalState.update('commentsHidden', commentsHidden); //<-Guardar el estado de visibilidad
}

//Cargar el array de comentarios desde el almacenamiento global de vsc
function loadCommentsFromStorage(context: vscode.ExtensionContext) {
	const savedComments = context.globalState.get<{text: string, position: vscode.Position, isEndOfLine: boolean }[]>('commentsArray');
	if(savedComments) {
		commentsArray = savedComments.map(comment => ({
			...comment,
			position: new vscode.Position(comment.position.line, comment.position.character),
		}));
		console.log("Comentarios cargados desde storage: ", commentsArray);
	} else {
		console.log("No se encontraron comentarios en storage.");
	}

	//Cargar el estado de visibilidad
	const savedHiddenState = context.globalState.get<boolean>('commentsHidden');
	if(savedHiddenState !== undefined) {
		commentsHidden = savedHiddenState;
	}
}

export function activate(context: vscode.ExtensionContext) {
	//Cargar comentarios al activar la extensión 
	loadCommentsFromStorage(context);

	//Creación del comando para mostrar o ocultar comentarios
	const hideCommentsCommand = vscode.commands.registerCommand('extension.toggleComments', () => {
		//Obtener la configuración de la extensión
		const config = vscode.workspace.getConfiguration('toggleComments');
		const isEnabled = config.get('enable'); //Obtener el valor del checkbox

		//Verificar si la funcionalidad está habilitada
		if(!isEnabled) {
			vscode.window.showInformationMessage("La función de ocultar/mostrar comentarios está deshabilitada.");
			return; //Si no está habilitada, salir de la función
		}

		//Editor de vsc -> si no hay ningún editor abierto (no hay archivos abiertos), no hay nada que hacer.
		const editor = vscode.window.activeTextEditor;
		//Si el editor está vacío termina el programa.
		if (!editor) {
			return;
		};

		//Obtener el documento actual del editor
		const document = editor.document;
		//Obtener el texto actual del documento
		const text = document.getText();

		//Expresiones regulares para identificar comentarios
		const singleLineComments = new RegExp('//.*$', 'gm');//<-Expresión regular para comentarios de una linea
		const blockComments = new RegExp('\\/\\*[\\s\\S]*?\\*\\/', 'gm');//<-Expresión regular para comentarios en bloque

		//Alterar la visibilidad
		if(!commentsHidden){//<-si los comentarios son visibles
			//Almacenarlos en el array
			commentsArray = [];
			let match;

			//Buscar comentarios de una linea "//" y añadirlos al array
			while((match = singleLineComments.exec(text)) !== null){
				const lineNumber = document.positionAt(match.index).line;//<-Linea donde se encuentra el comentario
				const lineText = document.lineAt(lineNumber).text;//<- El texto que hay en esa linea
				const isEndOfLine = lineText.trim().replace(match[0].trim(), '').trim() !== ''; //<- Verificar si hay código antes del comentario

				console.log("Línea encontrada:", lineNumber);
				console.log("Texto en la linea encontrada: ", lineText);
				console.log("Comprobar si va después de código: ", isEndOfLine);

				commentsArray.push({
					text: match[0],
					position: new vscode.Position(lineNumber, 0),
					isEndOfLine,//Guardar si el comentario estaba al final de una linea con código
				});//<- Agregar el comentario, la posición al array y si esta o no al final de una linea con código
			}

			//Buscar comentarios de bloque "/* */" y añadirlos al array
			while((match = blockComments.exec(text)) !== null){
				const startLine = document.positionAt(match.index).line;//<- Linea de inicio del bloque de comentario
				const endLine = startLine + match[0].split('\n').length - 1;//<- Linea del final del bloque de comentario
				console.log("Línea de inicio encontrada:", startLine + 1, "Línea de fin:", endLine + 1);
				commentsArray.push({
					text: match[0],
					position: new vscode.Position(startLine, 0),
					isEndOfLine: false, //<- los comentarios de bloque nunca están dentro de una linea
				});//<- Agregar el comentario y la posición al array
			}

			console.log("Comentarios ocultados:", commentsArray.map(comment => ({
				text: comment.text,
				line: comment.position.line,
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

			//Si los comentarios están ocultos, restaurarlos des del final del documento al principio
			commentsArray.slice().reverse().forEach(comment => {
				const lineNumber = comment.position.line;//<- Obtener la linea donde insertar el comentario
				const lines = newText.split('\n');//<- Dividir el texto en lineas

				//Si el comentario va después de código colocarlo
				if(comment.isEndOfLine) {
					lines[lineNumber] = lines[lineNumber].trimEnd() + ' ' + comment.text;//Al final de la linea de código
				} else {
					lines[lineNumber] = comment.text + (lines[lineNumber] || '');//Al inicio de la linea
				}

				console.log(`Reinsertando comentario en la línea ${lineNumber + 1}:`, comment.text);

				//Actualizar newText con las lineas reintegradas
				newText = lines.join('\n');
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

		//Guardar el array actualizado en el almacenamiento global
		saveCommentToStorage(context);
	});

	context.subscriptions.push(hideCommentsCommand);
	console.log('Congratulations, your extension "toggle-comments-visibility" is now active!');

}

export function deactivate() {}