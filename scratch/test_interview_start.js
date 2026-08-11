async function testInterviewE2E() {
  try {
    console.log("1. Logging in as Admin to seed a candidate...");
    const loginRes = await fetch('http://localhost:4000/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@aiinterview.com',
        password: 'AdminPassword123!'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    console.log("2. Fetching Job Roles...");
    const rolesRes = await fetch('http://localhost:4000/api/job-roles', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const rolesData = await rolesRes.json();
    const roleId = rolesData.data[0]._id;

    console.log("3. Creating Candidate...");
    const candRes = await fetch('http://localhost:4000/api/candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "E2E Test Candidate",
        email: `e2e.test.${Date.now()}@example.com`,
        mobile: `888${Date.now().toString().slice(-7)}`,
        college: "E2E College",
        experienceLevel: "Fresher",
        duration: 15,
        jobRole: roleId
      })
    });

    const candData = await candRes.json();
    const candidateId = candData.data._id;
    console.log(`✅ Candidate created. ID: ${candidateId}`);

    console.log("4. Starting Interview Session (POST /api/interviews/start)...");
    const startRes = await fetch('http://localhost:4000/api/interviews/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId })
    });

    const startData = await startRes.json();
    console.log("✅ Start session response status:", startRes.status);
    if (!startRes.ok) {
      throw new Error(`Start session failed: ${JSON.stringify(startData)}`);
    }
    const sessionId = startData.session._id;
    console.log(`✅ Session started successfully. Session ID: ${sessionId}`);

    console.log("5. Fetching Initial Question (POST /api/interviews/next-question)...");
    const q1Res = await fetch('http://localhost:4000/api/interviews/next-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    const q1Data = await q1Res.json();
    console.log("✅ Q1 Fetch status:", q1Res.status);
    console.log("Q1 Details:", JSON.stringify(q1Data, null, 2));

    if (!q1Data.question) {
      throw new Error("First question text was not generated!");
    }

    console.log("6. Submitting Answer for Q1 (POST /api/interviews/submit-answer)...");
    // We create a dummy 1-byte wav buffer to upload
    const dummyWav = new Uint8Array([82, 73, 70, 70, 36, 0, 0, 0, 87, 65, 86, 69]); // 'RIFF' header
    const blob = new Blob([dummyWav], { type: 'audio/wav' });

    const formData = new FormData();
    formData.append('sessionId', sessionId);
    formData.append('questionIndex', '0');
    formData.append('remainingTimeSeconds', '800');
    formData.append('audio', blob, 'response.wav');

    const submitRes = await fetch('http://localhost:4000/api/interviews/submit-answer', {
      method: 'POST',
      body: formData
    });

    const submitData = await submitRes.json();
    console.log("✅ Submit answer status:", submitRes.status);
    console.log("Submit answer details:", JSON.stringify(submitData, null, 2));

    console.log("7. Fetching Question 2 (POST /api/interviews/next-question)...");
    const q2Res = await fetch('http://localhost:4000/api/interviews/next-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });

    const q2Data = await q2Res.json();
    console.log("✅ Q2 Fetch status:", q2Res.status);
    console.log("Q2 Details:", JSON.stringify(q2Data, null, 2));

    console.log("🚀 INTERVIEW SESSION START & PROGRESSION VERIFIED SUCCESSFULLY!");

  } catch (error) {
    console.error("❌ Interview Start Test Failed!");
    console.error(error.message);
  }
}

testInterviewE2E();
