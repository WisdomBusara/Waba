import { Project, SyntaxKind, CallExpression, ArrowFunction, PropertyAccessExpression } from 'ts-morph';

const project = new Project();
project.addSourceFileAtPath('server.ts');
const sourceFile = project.getSourceFileOrThrow('server.ts');

// Find all db.prepare calls
const dbPrepareCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
  .filter(call => {
    const expr = call.getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr as PropertyAccessExpression;
      return propAccess.getExpression().getText() === 'db' && propAccess.getName() === 'prepare';
    }
    return false;
  });

for (const call of dbPrepareCalls) {
  const parent = call.getParent();
  if (parent && parent.getKind() === SyntaxKind.PropertyAccessExpression) {
    const propAccess = parent as PropertyAccessExpression;
    const grandParent = propAccess.getParent();
    if (grandParent && grandParent.getKind() === SyntaxKind.CallExpression) {
      const methodCall = grandParent as CallExpression;
      const methodName = propAccess.getName();
      if (['get', 'all', 'run'].includes(methodName)) {
        // Make sure the containing function is async
        let current = methodCall.getParent();
        while (current) {
          if (current.getKind() === SyntaxKind.ArrowFunction || current.getKind() === SyntaxKind.FunctionDeclaration || current.getKind() === SyntaxKind.FunctionExpression) {
            const func = current as any;
            if (!func.isAsync()) {
              func.setIsAsync(true);
            }
            break;
          }
          current = current.getParent();
        }
        
        // Replace with await
        if (methodCall.getParent()?.getKind() !== SyntaxKind.AwaitExpression) {
          methodCall.replaceWithText(`(await ${methodCall.getText()})`);
        }
      }
    }
  }
}

const insertItemCalls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
  .filter(call => {
    const expr = call.getExpression();
    if (expr.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expr as PropertyAccessExpression;
      return propAccess.getExpression().getText() === 'insertItem' && propAccess.getName() === 'run';
    }
    return false;
  });

for (const call of insertItemCalls) {
  if (call.getParent()?.getKind() !== SyntaxKind.AwaitExpression) {
    call.replaceWithText(`(await ${call.getText()})`);
  }
}

sourceFile.saveSync();
console.log('Transformation complete');
