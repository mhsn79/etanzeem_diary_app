export async function sendPushNotification(
    to: string,
    title: string,
    body: string,
    data: object = {}
  ) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        sound: 'default',
        title,
        body,
        data,
      }),
    });
  }

// Default export to satisfy Expo Router
export default {};
  