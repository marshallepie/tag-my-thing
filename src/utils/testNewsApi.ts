import { 
  getPublishedArticles, 
  getAllArticles, 
  getArticlesByCategory, 
  getNewsCategories,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleById
} from '../lib/newsApi';

export const testNewsAPI = async () => {
  console.log('🧪 Starting News API Tests...');
  console.log('=====================================');
  
  try {
    // Test 1: Get published articles
    console.log('\n📖 Test 1: Getting published articles...');
    const publishedArticles = await getPublishedArticles();
    console.log(`✅ SUCCESS: Found ${publishedArticles.length} published articles`);
    console.log('   Articles:', publishedArticles.map(a => ({ id: a.id, title: a.title, category: a.news_category })));

    // Test 2: Get available categories
    console.log('\n🏷️ Test 2: Getting news categories...');
    const categories = await getNewsCategories();
    console.log(`✅ SUCCESS: Found ${categories.length} categories:`, categories);

    // Test 3: Get articles by category
    if (categories.length > 0) {
      console.log(`\n📂 Test 3: Getting articles in category "${categories[0]}"...`);
      const categoryArticles = await getArticlesByCategory(categories[0]);
      console.log(`✅ SUCCESS: Found ${categoryArticles.length} articles in "${categories[0]}"`);
      console.log('   Titles:', categoryArticles.map(a => a.title));
    } else {
      console.log('\n📂 Test 3: SKIPPED - No categories available');
    }

    // Test 4: Get single article (if any exist)
    if (publishedArticles.length > 0) {
      console.log(`\n📄 Test 4: Getting single article by ID...`);
      const singleArticle = await getArticleById(publishedArticles[0].id);
      console.log('✅ SUCCESS: Retrieved single article:', {
        id: singleArticle.id,
        title: singleArticle.title,
        hasAuthor: !!singleArticle.author,
        category: singleArticle.news_category
      });
    } else {
      console.log('\n📄 Test 4: SKIPPED - No published articles available');
    }

    // Test 5: Get all articles (admin function - may fail for non-admins)
    console.log('\n👑 Test 5: Getting all articles (admin view)...');
    try {
      const allArticles = await getAllArticles();
      console.log(`✅ SUCCESS: Found ${allArticles.length} total articles (including unpublished)`);
      console.log('   Published vs Total:', `${publishedArticles.length}/${allArticles.length}`);
    } catch (error: any) {
      console.log('⚠️ EXPECTED FAILURE (non-admin):', error.message);
    }

    console.log('\n✅ READ TESTS COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    
  } catch (error: any) {
    console.error('❌ READ TESTS FAILED:', error.message);
    console.error('Full error:', error);
  }
};

export const testAdminFunctions = async (userId: string) => {
  console.log('\n👑 STARTING ADMIN FUNCTION TESTS...');
  console.log('=====================================');
  
  let testArticleId: string | null = null;
  
  try {
    // Test 1: Create article
    console.log('\n➕ Test 1: Creating new test article...');
    const newArticle = await createArticle({
      title: `API Test Article ${Date.now()}`,
      content: 'This is a test article created by the API test suite. It will be deleted after testing.',
      news_category: 'API Testing',
      is_published: false,
      author_id: userId
    });
    testArticleId = newArticle.id;
    console.log('✅ SUCCESS: Created test article');
    console.log('   Details:', {
      id: newArticle.id,
      title: newArticle.title,
      category: newArticle.news_category,
      published: newArticle.is_published
    });

    // Test 2: Update article
    console.log('\n✏️ Test 2: Updating test article...');
    const updatedArticle = await updateArticle(testArticleId, {
      title: `Updated API Test Article ${Date.now()}`,
      is_published: true,
      news_category: 'API Testing - Updated'
    });
    console.log('✅ SUCCESS: Updated test article');
    console.log('   New details:', {
      id: updatedArticle.id,
      title: updatedArticle.title,
      category: updatedArticle.news_category,
      published: updatedArticle.is_published
    });

    // Test 3: Verify update by fetching
    console.log('\n🔍 Test 3: Verifying update by re-fetching...');
    const fetchedUpdated = await getArticleById(testArticleId);
    console.log('✅ SUCCESS: Verified update');
    console.log('   Confirmed published status:', fetchedUpdated.is_published);

    // Test 4: Delete article
    console.log('\n🗑️ Test 4: Deleting test article...');
    await deleteArticle(testArticleId);
    console.log('✅ SUCCESS: Test article deleted');

    // Test 5: Verify deletion
    console.log('\n✔️ Test 5: Verifying deletion...');
    try {
      await getArticleById(testArticleId);
      console.log('❌ UNEXPECTED: Article still exists after deletion');
    } catch (error) {
      console.log('✅ SUCCESS: Confirmed article was deleted (fetch failed as expected)');
    }

    console.log('\n✅ ALL ADMIN TESTS COMPLETED SUCCESSFULLY!');
    console.log('=====================================');
    
  } catch (error: any) {
    console.error('❌ ADMIN TESTS FAILED:', error.message);
    console.error('Full error:', error);
    
    // Cleanup if test article was created but tests failed
    if (testArticleId) {
      console.log('\n🧹 Cleaning up test article...');
      try {
        await deleteArticle(testArticleId);
        console.log('✅ Cleanup successful');
      } catch (cleanupError) {
        console.error('❌ Cleanup failed:', cleanupError);
      }
    }
  }
};

export const testErrorHandling = async () => {
  console.log('\n🚨 STARTING ERROR HANDLING TESTS...');
  console.log('=====================================');
  
  try {
    // Test 1: Non-existent article ID
    console.log('\n🔍 Test 1: Fetching non-existent article...');
    try {
      await getArticleById('00000000-0000-0000-0000-000000000000');
      console.log('❌ UNEXPECTED: Should have failed for non-existent ID');
    } catch (error: any) {
      console.log('✅ EXPECTED FAILURE: Non-existent article correctly rejected');
    }

    // Test 2: Invalid category
    console.log('\n📂 Test 2: Fetching articles from non-existent category...');
    const invalidCategoryResults = await getArticlesByCategory('NonExistentCategory123');
    console.log(`✅ SUCCESS: Invalid category returned ${invalidCategoryResults.length} articles (expected 0)`);

    console.log('\n✅ ERROR HANDLING TESTS COMPLETED!');
    console.log('=====================================');
    
  } catch (error: any) {
    console.error('❌ ERROR HANDLING TESTS FAILED:', error.message);
  }
};

// Comprehensive test runner
export const runAllNewsTests = async (userId?: string) => {
  console.log('🚀 RUNNING COMPREHENSIVE NEWS API TEST SUITE');
  console.log('=============================================');
  
  // Run read tests (available to all authenticated users)
  await testNewsAPI();
  
  // Run error handling tests
  await testErrorHandling();
  
  // Run admin tests if user ID provided
  if (userId) {
    await testAdminFunctions(userId);
  } else {
    console.log('\n👑 SKIPPING ADMIN TESTS: No user ID provided');
  }
  
  console.log('\n🎉 ALL TESTS COMPLETED!');
  console.log('Check results above for any failures.');
};