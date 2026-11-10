export const SESSION_CHANNEL_NAME = "cardcase:session";

export const USER_CHANGED_MESSAGE = "user-changed";

let channel: BroadcastChannel | undefined;

function getOrCreateSessionChannel() {
  channel ??= new BroadcastChannel(SESSION_CHANNEL_NAME);
  return channel;
}

export function announceUserChange() {
  getOrCreateSessionChannel().postMessage(USER_CHANGED_MESSAGE);
}

export function onUserChangeElsewhere(listener: () => void) {
  const handleMessage = (event: MessageEvent) => {
    if (event.data === USER_CHANGED_MESSAGE) listener();
  };
  const current = getOrCreateSessionChannel();
  current.addEventListener("message", handleMessage);
  return () => current.removeEventListener("message", handleMessage);
}
