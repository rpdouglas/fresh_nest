import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import path from 'path'
import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest'

// storage.rules — crew job photos (P11 Brenda photo proof) and the admin gallery (P3-E32).
// Runs against the Storage emulator via `npm run test:rules`.

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'freshnest-aa51e',
    storage: {
      rules: readFileSync(path.resolve(__dirname, '../../..', 'storage.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearStorage()
})

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
const photo = (staffId: string, photoId = 'p1', jobId = 'job1') => `jobs/${jobId}/photos/${staffId}/${photoId}`

const staff = (uid: string, role = 'staff') => testEnv.authenticatedContext(uid, { role }).storage()
type Storage = ReturnType<typeof staff>

// UploadTask is thenable but not a Promise; wrap it so the assert helpers accept it.
const upload = (storage: Storage, filePath: string, data = JPEG, contentType = 'image/jpeg') =>
  Promise.resolve(storage.ref(filePath).put(data, { contentType }))

async function seed(filePath: string) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await ctx.storage().ref(filePath).put(JPEG, { contentType: 'image/jpeg' })
  })
}

describe('crew job photos', () => {
  it('a staff member can upload a photo into their own folder', async () => {
    await assertSucceeds(upload(staff('brenda'), photo('brenda'), JPEG, 'image/jpeg'))
  })

  it('supervisors and admins can upload into their own folder too', async () => {
    await assertSucceeds(upload(staff('sam', 'supervisor'), photo('sam'), JPEG, 'image/jpeg'))
    await assertSucceeds(upload(staff('lauren', 'admin'), photo('lauren'), JPEG, 'image/jpeg'))
  })

  it("nobody can upload into another person's folder", async () => {
    await assertFails(upload(staff('brenda'), photo('carla'), JPEG, 'image/jpeg'))
  })

  it('customers and signed-out users cannot upload', async () => {
    await assertFails(upload(staff('diane', 'customer'), photo('diane'), JPEG, 'image/jpeg'))
    await assertFails(upload(testEnv.unauthenticatedContext().storage(), photo('anon'), JPEG, 'image/jpeg'))
  })

  it('only images, under 15 MB', async () => {
    await assertFails(upload(staff('brenda'), photo('brenda', 'doc'), JPEG, 'application/pdf'))
    const big = new Uint8Array(15 * 1024 * 1024)
    await assertFails(upload(staff('brenda'), photo('brenda', 'big'), big, 'image/jpeg'))
  })

  it('photo evidence cannot be overwritten or deleted from a phone', async () => {
    await seed(photo('brenda'))
    await assertFails(upload(staff('brenda'), photo('brenda'), JPEG, 'image/jpeg'))
    await assertFails(staff('brenda').ref(photo('brenda')).delete())
  })

  it('the uploader and admins can read; other staff cannot', async () => {
    await seed(photo('brenda'))
    await assertSucceeds(staff('brenda').ref(photo('brenda')).getMetadata())
    await assertSucceeds(staff('lauren', 'admin').ref(photo('brenda')).getMetadata())
    await assertFails(staff('carla').ref(photo('brenda')).getMetadata())
    await assertFails(testEnv.unauthenticatedContext().storage().ref(photo('brenda')).getMetadata())
  })

  it('the old flat path (jobs/{jobId}/photos/{photoId}) stays closed', async () => {
    await assertFails(upload(staff('brenda'), 'jobs/job1/photos/p1', JPEG, 'image/jpeg'))
  })
})

describe('gallery (P3-E32, unchanged)', () => {
  it('admins can upload JPEGs under 1 MB; staff cannot', async () => {
    await assertSucceeds(upload(staff('lauren', 'admin'), 'gallery/pair1/before.jpg', JPEG, 'image/jpeg'))
    await assertFails(upload(staff('brenda'), 'gallery/pair1/before.jpg', JPEG, 'image/jpeg'))
  })
})

describe('everything else stays closed', () => {
  it('denies reads and writes outside the matched paths', async () => {
    await assertFails(upload(staff('lauren', 'admin'), 'other/file.jpg', JPEG, 'image/jpeg'))
  })
})
