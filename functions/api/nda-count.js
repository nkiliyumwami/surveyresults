export async function onRequestGet(context) {
  const resp = await fetch(
    'https://script.google.com/macros/s/AKfycbwOwKAk0A4epU_wGAu_43wkSSMen4E29OWxXovadvS0W4HiMRJRfZJe4v7xI2Z-IAfo7Q/exec',
    { redirect: 'follow' }
  );
  const text = await resp.text();
  return new Response(text, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://cybermentor.aikigali.com',
    },
  });
}
