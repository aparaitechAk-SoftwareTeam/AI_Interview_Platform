async function testBulkImportE2E() {
  try {
    console.log("1. Logging in as Admin...");
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

    console.log("2. Preparing Test CSV File for Preview...");
    const csvContent = 
`Full Name,Email,Mobile,College / Company,Job Role,Experience Level,Campaign,Duration
Valid Candidate One,valid1.bulk@example.com,9876543201,College A,Software Engineer (Frontend),Fresher,Fall Internship 2026 Outreach,5
Valid Candidate Two,valid2.bulk@example.com,9876543202,College B,Software Engineer (Backend),Junior,Fall Internship 2026 Outreach,5
Duplicate Candidate,valid1.bulk@example.com,9876543203,College C,Software Engineer (Frontend),Fresher,Fall Internship 2026 Outreach,5
Invalid Email Candidate,invalidemail,9876543205,College E,Software Engineer (Frontend),Fresher,Fall Internship 2026 Outreach,5`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', blob, 'candidates.csv');

    console.log("3. Uploading file to validation preview (POST /api/candidates/import-preview)...");
    const previewRes = await fetch('http://localhost:4000/api/candidates/import-preview', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const previewData = await previewRes.json();
    console.log("✅ Preview response status:", previewRes.status);
    console.log("Preview Summary:", JSON.stringify(previewData.summary, null, 2));
    console.log("Preview Rows:");
    previewData.rows.forEach(r => {
      console.log(`Row ${r.rowNumber}: ${r.name} (${r.email}) -> Status: ${r.status}, Reason: ${r.reason}, IsValid: ${r.isValid}`);
    });

    const validRows = previewData.rows.filter(r => r.isValid);
    console.log(`\nValid rows to import: ${validRows.length}`);

    console.log("4. Confirming Import (POST /api/candidates/import-confirm)...");
    const confirmRes = await fetch('http://localhost:4000/api/candidates/import-confirm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ candidates: validRows })
    });

    const confirmData = await confirmRes.json();
    console.log("✅ Confirm response status:", confirmRes.status);
    if (!confirmRes.ok) {
      console.error("❌ Confirm Error details:", JSON.stringify(confirmData, null, 2));
      throw new Error(`Import confirmation failed with status ${confirmRes.status}`);
    }
    console.log("Import Summary:", JSON.stringify(confirmData.summary, null, 2));
    console.log("Import Results:");
    confirmData.rows.forEach(r => {
      console.log(`- ${r.name} (${r.email}) -> Status: ${r.status}, Invitation Code: ${r.invitationCode}, Email Status: ${r.emailStatus}, Error: ${r.error}`);
    });

    console.log("5. Testing Single Add Candidate flows to make sure invitation email works too...");
    // Let's create a single candidate using POST /api/candidates
    const singleRes = await fetch('http://localhost:4000/api/candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "Single Test Candidate",
        email: `single.test.${Date.now()}@example.com`,
        mobile: `987${Date.now().toString().slice(-7)}`,
        college: "Single College",
        experienceLevel: "Fresher",
        duration: 30,
        jobRole: validRows[0].resolvedRoleId
      })
    });

    const singleData = await singleRes.json();
    console.log("✅ Single create response status:", singleRes.status);
    console.log("Single candidate invitation details:", JSON.stringify(singleData.invitation, null, 2));

    console.log("🚀 BULK IMPORT & INVITATION E2E TEST COMPLETED SUCCESSFULLY!");

  } catch (error) {
    console.error("❌ Bulk Import E2E Test Failed!");
    console.error(error.message);
  }
}

testBulkImportE2E();
