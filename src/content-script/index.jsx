// Global variable to hold the toolbar container
let toolbarContainer;

async function prepareForSelectionToolsTouch() {
  document.addEventListener('touchend', async (e) => {
    const selection = window
      .getSelection()
      ?.toString()
      .trim()
      .replace(/^-+|-+$/g, '')

    if (selection) {
      const touch = e.changedTouches[0]
      let position

      if (!config.selectionToolsNextToInputBox) {
        position = { x: e.pageX + 20, y: e.pageY + 20 };
      } else {
        const inputElement = e.target.closest('input, textarea');
        if (inputElement) {
          const inputPosition = getClientPosition(inputElement);
          position = {
            x: inputPosition.x + window.scrollX + inputElement.offsetWidth + 50,
            y: e.pageY + 30,
          }
        } else {
          position = { x: e.pageX + 20, y: e.pageY + 20 }
        }
      }
      toolbarContainer = createElementAtPosition(position.x, position.y)
      await createSelectionTools(toolbarContainer, selection)
    }
  })
}

// Function to handle the mouseup and touchend events
async function prepareForEvents() {
  document.addEventListener('mouseup', async (e) => {
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      const position = { x: e.pageX + 20, y: e.pageY + 20 };
      toolbarContainer = createElementAtPosition(position.x, position.y);
      await createSelectionTools(toolbarContainer, selection);
    }
  });
}

// Function to handle the contextmenu event
async function prepareForRightClickMenu() {
  document.addEventListener('contextmenu', async (e) => {
    e.preventDefault();
    const container = createElementAtPosition(e.clientX, e.clientY);
    container.className = 'chatgptbox-toolbar-container-not-queryable';
    render(
      <FloatingToolbar
        session={initSession({ modelName: (await getUserConfig()).modelName })}
        selection={window.getSelection().toString()}
        container={container}
        triggered={true}
        closeable={true}
        prompt={await generateCustomApiPrompt()}
      />,
      container,
    )
  });
}

// Function to overwrite the access token
async function overwriteAccessToken() {
  if (location.hostname !== 'chatgpt.com') {
    if (location.hostname === 'kimi.moonshot.cn') {
      setUserConfig({
        kimiMoonShotRefreshToken: window.localStorage.refresh_token,
      });
      return;
    }
    return;
  }

  if (location.pathname === '/api/auth/session') {
    const data = JSON.parse(document.querySelector('pre').textContent);
    setUserConfig(data);
  } else if (location.pathname === '/backend-api/conversation') {
    // Add code to handle this case if needed
  }
}