/** Simplified server-side friendly stubs and spies for CanvasElement.context */
export function stubCanvas() {
  const canvasContext = {
    fillStyle: "",
    fillRect(x: number, y: number, width: number, height: number) {},
    clearRect(x: number, y: number, width: number, height: number) {}
  };
  //Stub global.document to provide support for basic canvas operations
  (<any>global).document = {
    querySelector(domElement: string) {
      return {
        getContext(contextType: string) {
          return canvasContext;
        }
      };
    }
  };
}
