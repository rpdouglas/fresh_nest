import { describe, it, expect } from 'vitest'
import { jobPhotoPath } from './jobPhotoPath'

// storage.rules only allows crew uploads under jobs/{jobId}/photos/{their uid}/...
describe('jobPhotoPath', () => {
  it("puts the photo in the uploader's own folder under the job", () => {
    expect(jobPhotoPath('job1', 'uid-brenda', 'p1')).toBe('jobs/job1/photos/uid-brenda/p1')
  })
})
